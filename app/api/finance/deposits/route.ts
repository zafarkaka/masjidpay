import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, getOrResolveMasjid } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');
    const bankAccountId = searchParams.get('bankAccountId');
    const type = searchParams.get('type');
    const month = searchParams.get('month'); // "1" to "12"
    const year = searchParams.get('year'); // "2026"
    const financialYear = searchParams.get('financialYear');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);
    if (!masjid) {
      return NextResponse.json({
        transactions: [],
        summary: {
          openingCashBalance: 0,
          openingBankBalance: 0,
          totalCashDeposited: 0,
          totalCashWithdrawn: 0,
          totalChequeDeposits: 0,
          totalIncome: 0,
          totalExpenses: 0,
          currentCashInHand: 0,
          currentBankBalance: 0,
          actualTotalBalance: 0,
        },
      });
    }

    const masjidId = masjid.id;
    const selectedFY = financialYear || masjid.financialYear || '2026-2027';

    // Build query filter
    const whereClause: any = {
      masjidId,
      isVoided: false,
    };

    if (bankAccountId && bankAccountId !== 'ALL') {
      whereClause.bankAccountId = bankAccountId;
    }

    if (type && type !== 'ALL') {
      whereClause.type = type;
    }

    if (year && month) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      whereClause.date = { gte: start, lte: end };
    } else if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year), 11, 31, 23, 59, 59, 999);
      whereClause.date = { gte: start, lte: end };
    }

    const [
      transactions,
      bankAccounts,
      fyRecord,
      // Total Inflows (All sources)
      donationsAgg,
      membersAgg,
      incomesAgg,
      // Cash Inflows
      donationsCashAgg,
      membersCashAgg,
      incomesCashAgg,
      // Total Expenses (All sources)
      expensesAgg,
      payrollsAgg,
      // Cash Expenses
      expensesCashAgg,
      payrollsCashAgg,
      // Bank Transactions
      cashDepositsAgg,
      chequeDepositsAgg,
      withdrawalsAgg,
    ] = await Promise.all([
      prisma.bankTransaction.findMany({
        where: whereClause,
        include: { bankAccount: true },
        orderBy: { date: 'desc' },
      }),
      prisma.bankAccount.findMany({
        where: { masjidId, status: 'ACTIVE' },
        include: { yearlyOpenings: true },
      }),
      prisma.masjidFinancialYear.findUnique({
        where: { masjidId_year: { masjidId, year: selectedFY } },
      }),
      // Inflows
      prisma.donation.aggregate({ where: { masjidId, isVoided: false }, _sum: { amount: true } }),
      prisma.memberCollection.aggregate({ where: { masjidId }, _sum: { amount: true } }),
      prisma.income.aggregate({ where: { masjidId, isVoided: false }, _sum: { amount: true } }),
      // Cash Inflows
      prisma.donation.aggregate({ where: { masjidId, paymentMethod: 'CASH', isVoided: false }, _sum: { amount: true } }),
      prisma.memberCollection.aggregate({ where: { masjidId, paymentMethod: 'CASH' }, _sum: { amount: true } }),
      prisma.income.aggregate({ where: { masjidId, paymentMethod: 'CASH', isVoided: false }, _sum: { amount: true } }),
      // Outflows
      prisma.expense.aggregate({ where: { masjidId, isVoided: false }, _sum: { amount: true } }),
      prisma.payroll.aggregate({ where: { masjidId }, _sum: { amount: true } }),
      // Cash Outflows
      prisma.expense.aggregate({ where: { masjidId, paymentMethod: 'CASH', isVoided: false }, _sum: { amount: true } }),
      prisma.payroll.aggregate({ where: { masjidId, paymentMethod: 'CASH' }, _sum: { amount: true } }),
      // Bank Transactions
      prisma.bankTransaction.aggregate({ where: { masjidId, type: 'CASH_DEPOSIT', isVoided: false }, _sum: { amount: true } }),
      prisma.bankTransaction.aggregate({ where: { masjidId, type: 'CHEQUE_DEPOSIT', isVoided: false }, _sum: { amount: true } }),
      prisma.bankTransaction.aggregate({ where: { masjidId, type: 'WITHDRAWAL', isVoided: false }, _sum: { amount: true } }),
    ]);

    // 1. Opening Balances
    const openingCash = fyRecord?.openingCash ?? Number(masjid.openingCashBalance || masjid.openingBalance || 0);
    const openingBank = bankAccounts.reduce((sum, b) => {
      const yearOpening = b.yearlyOpenings.find((y) => y.financialYear === selectedFY);
      return sum + (yearOpening ? yearOpening.openingBalance : Number(b.openingBalance) || 0);
    }, 0);

    // 2. Inflows & Outflows
    const totalIncome = (donationsAgg._sum.amount || 0) + (membersAgg._sum.amount || 0) + (incomesAgg._sum.amount || 0);
    const totalExpenses = (expensesAgg._sum.amount || 0) + (payrollsAgg._sum.amount || 0);

    const cashInflows = (donationsCashAgg._sum.amount || 0) + (membersCashAgg._sum.amount || 0) + (incomesCashAgg._sum.amount || 0);
    const cashOutflows = (expensesCashAgg._sum.amount || 0) + (payrollsCashAgg._sum.amount || 0);

    // 3. Bank Deposits & Withdrawals
    const totalCashDeposited = cashDepositsAgg._sum.amount || 0;
    const totalChequeDeposited = chequeDepositsAgg._sum.amount || 0;
    const totalCashWithdrawn = withdrawalsAgg._sum.amount || 0;

    // 4. Current Balances
    // Current Cash in Hand = Opening Cash + Cash Inflows - Cash Outflows - Cash Deposited to Bank + Cash Withdrawn from Bank
    const currentCashInHand = openingCash + cashInflows - cashOutflows - totalCashDeposited + totalCashWithdrawn;

    // Current Bank Balance = Sum of all active bank balances
    const currentBankBalance = bankAccounts.reduce((sum, b) => sum + (Number(b.currentBalance) || 0), 0);

    // Actual Total Balance = Current Cash in Hand + Current Bank Balance
    const actualTotalBalance = Math.max(0, currentCashInHand) + currentBankBalance;

    return NextResponse.json({
      transactions,
      bankAccounts: bankAccounts.map((b) => ({
        id: b.id,
        bankName: b.bankName,
        accountName: b.accountName,
        accountNumber: b.accountNumber,
        ifscCode: b.ifscCode,
        openingBalance: b.openingBalance,
        currentBalance: b.currentBalance,
      })),
      summary: {
        financialYear: selectedFY,
        openingCashBalance: openingCash,
        openingBankBalance: openingBank,
        totalOpeningBalance: openingCash + openingBank,
        totalCashDeposited,
        totalCashWithdrawn,
        totalChequeDeposited,
        totalDeposits: totalCashDeposited + totalChequeDeposited,
        totalIncome,
        totalExpenses,
        currentCashInHand: Math.max(0, currentCashInHand),
        rawCashInHand: currentCashInHand,
        currentBankBalance,
        actualTotalBalance,
      },
    });
  } catch (error: any) {
    console.error('Error fetching bank deposits:', error);
    return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);
    if (!masjid) {
      return NextResponse.json({ error: 'Masjid context required' }, { status: 400 });
    }

    const body = await req.json();
    const { bankAccountId, type, amount, date, chequeNo, chequeDate, referenceNo, notes } = body;

    if (!bankAccountId || !type || !amount) {
      return NextResponse.json({ error: 'Bank Account, Transaction Type, and Amount are required' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (numAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id: bankAccountId, masjidId: masjid.id },
    });

    if (!bankAccount) {
      return NextResponse.json({ error: 'Selected bank account was not found' }, { status: 404 });
    }

    const parsedDate = date ? new Date(date) : new Date();
    const parsedChequeDate = chequeDate ? new Date(chequeDate) : null;

    // 1. Create the bank transaction
    const transaction = await prisma.bankTransaction.create({
      data: {
        masjidId: masjid.id,
        bankAccountId: bankAccount.id,
        type, // "CASH_DEPOSIT", "CHEQUE_DEPOSIT", or "WITHDRAWAL"
        amount: numAmount,
        date: parsedDate,
        chequeNo: chequeNo || null,
        chequeDate: parsedChequeDate,
        referenceNo: referenceNo || null,
        notes: notes || null,
        financialYear: masjid.financialYear || '2026-2027',
      },
    });

    // 2. Adjust target Bank Account balance
    if (type === 'WITHDRAWAL') {
      // Cash withdrawal from bank reduces Bank Balance (and automatically increments Cash In Hand in calculations)
      await prisma.bankAccount.update({
        where: { id: bankAccount.id },
        data: { currentBalance: { decrement: numAmount } },
      });
    } else {
      // CASH_DEPOSIT or CHEQUE_DEPOSIT increments Bank Balance
      await prisma.bankAccount.update({
        where: { id: bankAccount.id },
        data: { currentBalance: { increment: numAmount } },
      });
    }

    try {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session?.userId,
        userEmail: session?.email,
        userRole: session?.role,
        action: `RECORD_${type}`,
        entity: 'BankTransaction',
        entityId: transaction.id,
      });
    } catch (e) {}

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    console.error('Error creating deposit/withdrawal:', error);
    return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
  }
}

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
    const month = searchParams.get('month'); // "YYYY-MM" or "MM"
    const year = searchParams.get('year'); // "YYYY"

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);
    if (!masjid) {
      return NextResponse.json({
        transactions: [],
        summary: {
          totalBankBalance: 0,
          cashInHand: 0,
          totalCashDeposits: 0,
          totalChequeDeposits: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          openingCashBalance: 0,
          openingBankBalance: 0,
        },
      });
    }

    const masjidId = masjid.id;

    // Build filter
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
      totalCashInflowsDonations,
      totalCashInflowsMembers,
      totalCashInflowsIncome,
      totalCashOutflowsExpenses,
      totalCashOutflowsPayrolls,
      allCashDeposits,
      allChequeDeposits,
      allWithdrawals,
    ] = await Promise.all([
      prisma.bankTransaction.findMany({
        where: whereClause,
        include: { bankAccount: true },
        orderBy: { date: 'desc' },
      }),
      prisma.bankAccount.findMany({
        where: { masjidId, status: 'ACTIVE' },
      }),
      // Cash Inflows:
      prisma.donation.aggregate({
        where: { masjidId, paymentMethod: 'CASH', isVoided: false },
        _sum: { amount: true },
      }),
      prisma.memberCollection.aggregate({
        where: { masjidId, paymentMethod: 'CASH' },
        _sum: { amount: true },
      }),
      prisma.income.aggregate({
        where: { masjidId, paymentMethod: 'CASH', isVoided: false },
        _sum: { amount: true },
      }),
      // Cash Outflows:
      prisma.expense.aggregate({
        where: { masjidId, paymentMethod: 'CASH', isVoided: false },
        _sum: { amount: true },
      }),
      prisma.payroll.aggregate({
        where: { masjidId, paymentMethod: 'CASH' },
        _sum: { amount: true },
      }),
      // Deposits & Withdrawals:
      prisma.bankTransaction.aggregate({
        where: { masjidId, type: 'CASH_DEPOSIT', isVoided: false },
        _sum: { amount: true },
      }),
      prisma.bankTransaction.aggregate({
        where: { masjidId, type: 'CHEQUE_DEPOSIT', isVoided: false },
        _sum: { amount: true },
      }),
      prisma.bankTransaction.aggregate({
        where: { masjidId, type: 'WITHDRAWAL', isVoided: false },
        _sum: { amount: true },
      }),
    ]);

    const openingCash = Number(masjid.openingCashBalance || masjid.openingBalance || 0);
    const openingBank = bankAccounts.reduce((sum, b) => sum + (Number(b.openingBalance) || 0), 0);
    const totalBankBalance = bankAccounts.reduce((sum, b) => sum + (Number(b.currentBalance) || 0), 0);

    const cashInflows =
      (totalCashInflowsDonations._sum.amount || 0) +
      (totalCashInflowsMembers._sum.amount || 0) +
      (totalCashInflowsIncome._sum.amount || 0);

    const cashOutflows =
      (totalCashOutflowsExpenses._sum.amount || 0) +
      (totalCashOutflowsPayrolls._sum.amount || 0);

    const totalCashDeposited = allCashDeposits._sum.amount || 0;
    const totalChequeDeposited = allChequeDeposits._sum.amount || 0;
    const totalWithdrawn = allWithdrawals._sum.amount || 0;

    // Cash In Hand = Opening Cash + Cash Inflows - Cash Outflows - Cash Deposited to Bank
    const cashInHand = openingCash + cashInflows - cashOutflows - totalCashDeposited;

    return NextResponse.json({
      transactions,
      bankAccounts,
      summary: {
        totalBankBalance,
        cashInHand: Math.max(0, cashInHand),
        rawCashInHand: cashInHand,
        totalCashDeposits: totalCashDeposited,
        totalChequeDeposits: totalChequeDeposited,
        totalDeposits: totalCashDeposited + totalChequeDeposited,
        totalWithdrawals: totalWithdrawn,
        openingCashBalance: openingCash,
        openingBankBalance: openingBank,
        totalLiquidFunds: totalBankBalance + Math.max(0, cashInHand),
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
      return NextResponse.json({ error: 'Bank Account, Deposit Type, and Amount are required' }, { status: 400 });
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

    // 2. Increment / decrement target Bank Account balance
    if (type === 'WITHDRAWAL') {
      await prisma.bankAccount.update({
        where: { id: bankAccount.id },
        data: { currentBalance: { decrement: numAmount } },
      });
    } else {
      // CASH_DEPOSIT or CHEQUE_DEPOSIT adds to bank balance
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
    console.error('Error creating deposit:', error);
    return NextResponse.json({ error: 'Failed to record deposit' }, { status: 500 });
  }
}

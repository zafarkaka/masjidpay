import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, getOrResolveMasjid } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');
    const month = searchParams.get('month'); // e.g. "08" or "8"
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const bankAccountId = searchParams.get('bankAccountId');
    const type = searchParams.get('type');
    const format = searchParams.get('format'); // "json" or "csv"

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);
    if (!masjid) {
      return NextResponse.json({ error: 'Masjid context required' }, { status: 400 });
    }

    const masjidId = masjid.id;
    const numYear = Number(year);
    const numMonth = month ? Number(month) : new Date().getMonth() + 1;

    // Date range for the selected month
    const startDate = new Date(numYear, numMonth - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(numYear, numMonth, 0, 23, 59, 59, 999);

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { masjidId, status: 'ACTIVE' },
    });

    // 1. Calculate Opening Bank Balance at start of selected month
    // Starting point = openingBalance of all active banks
    // + all deposits before startDate - all withdrawals before startDate
    const priorDepositsWhere: any = {
      masjidId,
      isVoided: false,
      date: { lt: startDate },
    };
    if (bankAccountId && bankAccountId !== 'ALL') {
      priorDepositsWhere.bankAccountId = bankAccountId;
    }

    const [priorDepositsCash, priorDepositsCheque, priorWithdrawals] = await Promise.all([
      prisma.bankTransaction.aggregate({
        where: { ...priorDepositsWhere, type: 'CASH_DEPOSIT' },
        _sum: { amount: true },
      }),
      prisma.bankTransaction.aggregate({
        where: { ...priorDepositsWhere, type: 'CHEQUE_DEPOSIT' },
        _sum: { amount: true },
      }),
      prisma.bankTransaction.aggregate({
        where: { ...priorDepositsWhere, type: 'WITHDRAWAL' },
        _sum: { amount: true },
      }),
    ]);

    const targetBankOpening = bankAccountId && bankAccountId !== 'ALL'
      ? (bankAccounts.find((b) => b.id === bankAccountId)?.openingBalance || 0)
      : bankAccounts.reduce((sum, b) => sum + (Number(b.openingBalance) || 0), 0);

    const openingBankBalance =
      targetBankOpening +
      (priorDepositsCash._sum.amount || 0) +
      (priorDepositsCheque._sum.amount || 0) -
      (priorWithdrawals._sum.amount || 0);

    // 2. Month transactions
    const monthWhere: any = {
      masjidId,
      isVoided: false,
      date: { gte: startDate, lte: endDate },
    };
    if (bankAccountId && bankAccountId !== 'ALL') {
      monthWhere.bankAccountId = bankAccountId;
    }
    if (type && type !== 'ALL') {
      monthWhere.type = type;
    }

    const [monthTransactions, monthCashDeposits, monthChequeDeposits, monthWithdrawals, monthExpenses, monthPayrolls] = await Promise.all([
      prisma.bankTransaction.findMany({
        where: monthWhere,
        include: { bankAccount: true },
        orderBy: { date: 'asc' },
      }),
      prisma.bankTransaction.aggregate({
        where: { ...monthWhere, type: 'CASH_DEPOSIT' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.bankTransaction.aggregate({
        where: { ...monthWhere, type: 'CHEQUE_DEPOSIT' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.bankTransaction.aggregate({
        where: { ...monthWhere, type: 'WITHDRAWAL' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { masjidId, isVoided: false, date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.payroll.aggregate({
        where: { masjidId, paymentDate: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
    ]);

    const totalCashDeposits = monthCashDeposits._sum.amount || 0;
    const totalChequeDeposits = monthChequeDeposits._sum.amount || 0;
    const totalBankDeposits = totalCashDeposits + totalChequeDeposits;
    const totalManualWithdrawals = monthWithdrawals._sum.amount || 0;

    // Total withdrawals/expenses for the month
    const totalMonthlyExpenses = (monthExpenses._sum.amount || 0) + (monthPayrolls._sum.amount || 0);
    const totalWithdrawalsExpenses = totalManualWithdrawals + totalMonthlyExpenses;

    const closingBankBalance = openingBankBalance + totalBankDeposits - totalManualWithdrawals;

    // 3. Bank-wise breakdown calculation
    const bankWiseBreakdown = await Promise.all(
      bankAccounts.map(async (acc) => {
        const [accCash, accCheque, accWithdrawn] = await Promise.all([
          prisma.bankTransaction.aggregate({
            where: { masjidId, bankAccountId: acc.id, type: 'CASH_DEPOSIT', isVoided: false, date: { gte: startDate, lte: endDate } },
            _sum: { amount: true },
          }),
          prisma.bankTransaction.aggregate({
            where: { masjidId, bankAccountId: acc.id, type: 'CHEQUE_DEPOSIT', isVoided: false, date: { gte: startDate, lte: endDate } },
            _sum: { amount: true },
          }),
          prisma.bankTransaction.aggregate({
            where: { masjidId, bankAccountId: acc.id, type: 'WITHDRAWAL', isVoided: false, date: { gte: startDate, lte: endDate } },
            _sum: { amount: true },
          }),
        ]);

        const c = accCash._sum.amount || 0;
        const q = accCheque._sum.amount || 0;
        const w = accWithdrawn._sum.amount || 0;

        return {
          id: acc.id,
          bankName: acc.bankName,
          accountNumber: acc.accountNumber,
          accountName: acc.accountName,
          currentBalance: acc.currentBalance,
          cashDeposits: c,
          chequeDeposits: q,
          totalDeposits: c + q,
          withdrawals: w,
        };
      })
    );

    // CSV Export Handling
    if (format === 'csv') {
      const monthName = startDate.toLocaleString('default', { month: 'long' });
      let csvContent = `MasjidPay Monthly Finance Statement\n`;
      csvContent += `Masjid: ${masjid.name}\n`;
      csvContent += `Period: ${monthName} ${numYear}\n`;
      csvContent += `Generated: ${new Date().toISOString()}\n\n`;

      csvContent += `SUMMARY METRICS (INR)\n`;
      csvContent += `Opening Bank Balance,${openingBankBalance}\n`;
      csvContent += `Total Cash Deposits,${totalCashDeposits}\n`;
      csvContent += `Total Cheque Deposits,${totalChequeDeposits}\n`;
      csvContent += `Total Bank Deposits,${totalBankDeposits}\n`;
      csvContent += `Total Withdrawals & Expenses,${totalWithdrawalsExpenses}\n`;
      csvContent += `Closing Bank Balance,${closingBankBalance}\n\n`;

      csvContent += `TRANSACTION BREAKDOWN\n`;
      csvContent += `Date,Type,Bank Name,Account Number,Amount,Cheque No,Cheque Date,Reference,Notes\n`;

      monthTransactions.forEach((t) => {
        const d = new Date(t.date).toISOString().split('T')[0];
        const cqDate = t.chequeDate ? new Date(t.chequeDate).toISOString().split('T')[0] : '';
        const safeRef = (t.referenceNo || '').replace(/,/g, ' ');
        const safeNotes = (t.notes || '').replace(/,/g, ' ');
        csvContent += `"${d}","${t.type}","${t.bankAccount?.bankName || ''}","•••• ${(t.bankAccount?.accountNumber || '').slice(-4)}",${t.amount},"${t.chequeNo || ''}","${cqDate}","${safeRef}","${safeNotes}"\n`;
      });

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Finance_Report_${numYear}_${numMonth}_${masjid.slug}.csv"`,
        },
      });
    }

    return NextResponse.json({
      period: {
        month: numMonth,
        year: numYear,
        monthName: startDate.toLocaleString('default', { month: 'long' }),
      },
      summary: {
        openingBankBalance,
        totalCashDeposits,
        totalChequeDeposits,
        totalBankDeposits,
        totalWithdrawalsExpenses,
        totalManualWithdrawals,
        totalMonthlyExpenses,
        closingBankBalance,
      },
      counts: {
        cashCount: monthCashDeposits._count || 0,
        chequeCount: monthChequeDeposits._count || 0,
        totalCount: monthTransactions.length,
      },
      bankWiseBreakdown,
      transactions: monthTransactions,
      bankAccounts,
    });
  } catch (error: any) {
    console.error('Error generating finance report:', error);
    return NextResponse.json({ error: 'Failed to generate finance report' }, { status: 500 });
  }
}

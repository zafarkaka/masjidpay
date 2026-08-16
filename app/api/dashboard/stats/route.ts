import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { generateFinancialInsights } from '@/lib/insights';
import { ensureDatabaseTables } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    await ensureDatabaseTables(prisma);

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {
      // fallback
    }

    let masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session?.masjidId || 'none' },
          { id: masjidIdParam || 'none' },
          { slug: masjidIdParam || 'none' },
          { slug: 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      masjid = await prisma.masjid.findFirst();
    }

    if (!masjid) {
      return NextResponse.json({
        kpis: {
          totalDonations: 0,
          monthDonations: 0,
          totalExpenses: 0,
          monthExpenses: 0,
          netBalance: 0,
          memberCount: 0,
          activeCampaigns: 0,
        },
        recentDonations: [],
        recentExpenses: [],
        charts: { monthlyTrend: [], donationCategories: [], expenseCategories: [] },
        insights: [],
      });
    }

    const masjidId = masjid.id;
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalDonations,
      monthDonations,
      totalExpenses,
      monthExpenses,
      totalIncome,
      monthIncome,
      recurringDonationsActive,
      memberCollections,
      members,
      staffList,
      payrollsMonth,
      recentDonations,
      recentExpenses,
      donationCategories,
      expenseCategories,
    ] = await Promise.all([
      prisma.donation.aggregate({ where: { masjidId, isVoided: false }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.donation.aggregate({ where: { masjidId, isVoided: false, date: { gte: currentMonthStart } }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.expense.aggregate({ where: { masjidId, isVoided: false }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.expense.aggregate({ where: { masjidId, isVoided: false, date: { gte: currentMonthStart } }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.income.aggregate({ where: { masjidId, isVoided: false }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.income.aggregate({ where: { masjidId, isVoided: false, date: { gte: currentMonthStart } }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.recurringDonation.aggregate({ where: { masjidId, status: 'ACTIVE' }, _sum: { amount: true }, _count: true }).catch(() => ({ _sum: { amount: 0 }, _count: 0 })),
      prisma.memberCollection.aggregate({ where: { masjidId }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.member.findMany({ where: { masjidId, status: 'ACTIVE' } }).catch(() => []),
      prisma.staff.findMany({ where: { masjidId, status: 'ACTIVE' } }).catch(() => []),
      prisma.payroll.aggregate({ where: { masjidId, paymentDate: { gte: currentMonthStart } }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.donation.findMany({
        where: { masjidId, isVoided: false },
        include: { donor: true, category: true },
        orderBy: { date: 'desc' },
        take: 5,
      }).catch(() => []),
      prisma.expense.findMany({
        where: { masjidId, isVoided: false },
        include: { category: true },
        orderBy: { date: 'desc' },
        take: 5,
      }).catch(() => []),
      prisma.donationCategory.findMany({ where: { masjidId } }).catch(() => []),
      prisma.expenseCategory.findMany({ where: { masjidId } }).catch(() => []),
    ]);

    // Calculate Monthly Trend for last 6 months
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short' });

      const mDonation = await prisma.donation.aggregate({
        where: { masjidId, isVoided: false, date: { gte: d, lt: nextD } },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: 0 } }));

      const mExpense = await prisma.expense.aggregate({
        where: { masjidId, isVoided: false, date: { gte: d, lt: nextD } },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: 0 } }));

      monthlyTrend.push({
        month: monthLabel,
        donations: mDonation._sum.amount || 0,
        expenses: mExpense._sum.amount || 0,
      });
    }

    const totalDonationsVal = (totalDonations._sum.amount || 0) + (memberCollections._sum.amount || 0);
    const totalIncomeVal = totalIncome._sum.amount || 0;
    const totalExpensesVal = totalExpenses._sum.amount || 0;
    const netBalance = masjid.openingBalance + totalDonationsVal + totalIncomeVal - totalExpensesVal;

    const insights = await generateFinancialInsights(masjidId).catch(() => []);

    return NextResponse.json({
      masjid: {
        id: masjid.id,
        name: masjid.name,
        slug: masjid.slug,
        status: masjid.status,
        currency: masjid.currency,
        openingBalance: masjid.openingBalance,
      },
      kpis: {
        totalDonations: totalDonationsVal,
        monthDonations: monthDonations._sum.amount || 0,
        totalExpenses: totalExpensesVal,
        monthExpenses: monthExpenses._sum.amount || 0,
        totalIncome: totalIncomeVal,
        monthIncome: monthIncome._sum.amount || 0,
        recurringDonationsActive: recurringDonationsActive._count || 0,
        recurringMonthlyTotal: recurringDonationsActive._sum.amount || 0,
        memberCount: members.length,
        staffCount: staffList.length,
        monthlyPayroll: payrollsMonth._sum.amount || 0,
        netBalance,
      },
      charts: {
        monthlyTrend,
        donationCategories: donationCategories.map((c) => ({ id: c.id, name: c.name })),
        expenseCategories: expenseCategories.map((c) => ({ id: c.id, name: c.name })),
      },
      recentDonations,
      recentExpenses,
      insights,
    });
  } catch (error: any) {
    console.error('Dashboard Stats API error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}

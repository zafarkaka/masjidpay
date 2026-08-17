import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, getOrResolveMasjid } from '@/lib/tenant';
import { generateFinancialInsights } from '@/lib/insights';
import { ensureDatabaseTables } from '@/lib/db-init';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);

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
      monthMemberCollections,
      members,
      staffList,
      payrollsMonth,
      allPayrolls,
      recentDonations,
      recentExpenses,
      recentIncomes,
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
      prisma.memberCollection.aggregate({ where: { masjidId }, _sum: { amount: true }, _count: true }).catch(() => ({ _sum: { amount: 0 }, _count: 0 })),
      prisma.memberCollection.aggregate({ where: { masjidId, paymentDate: { gte: currentMonthStart } }, _sum: { amount: true }, _count: true }).catch(() => ({ _sum: { amount: 0 }, _count: 0 })),
      prisma.member.findMany({ where: { masjidId, status: 'ACTIVE' } }).catch(() => []),
      prisma.staff.findMany({ where: { masjidId, status: 'ACTIVE' } }).catch(() => []),
      prisma.payroll.aggregate({ where: { masjidId, paymentDate: { gte: currentMonthStart } }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.payroll.aggregate({ where: { masjidId }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
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
      prisma.income.findMany({
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

      const mIncome = await prisma.income.aggregate({
        where: { masjidId, isVoided: false, date: { gte: d, lt: nextD } },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: 0 } }));

      const mExpense = await prisma.expense.aggregate({
        where: { masjidId, isVoided: false, date: { gte: d, lt: nextD } },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: 0 } }));

      monthlyTrend.push({
        month: monthLabel,
        donations: (mDonation._sum.amount || 0) + (mIncome._sum.amount || 0),
        expenses: mExpense._sum.amount || 0,
      });
    }

    const donationsSum = totalDonations._sum.amount || 0;
    const memberCollectionsSum = memberCollections._sum.amount || 0;
    const mosqueIncomeSum = totalIncome._sum.amount || 0;
    const overallTotalIncome = donationsSum + memberCollectionsSum + mosqueIncomeSum;

    const regularExpensesSum = totalExpenses._sum.amount || 0;
    const payrollExpensesSum = allPayrolls._sum.amount || 0;
    const overallTotalExpenses = regularExpensesSum + payrollExpensesSum;

    const netBalance = (masjid.openingBalance || 0) + overallTotalIncome - overallTotalExpenses;

    const thisMonthInflows =
      (monthDonations._sum.amount || 0) +
      (monthMemberCollections._sum.amount || 0) +
      (monthIncome._sum.amount || 0);

    const totalMembersCount = members.length;
    const paidMembersCount = Math.min(totalMembersCount, monthMemberCollections._count || 0);
    const pendingMembersCount = Math.max(0, totalMembersCount - paidMembersCount);
    const completionRate = totalMembersCount > 0 ? Math.round((paidMembersCount / totalMembersCount) * 1000) / 10 : 0;

    const activeStaffCount = staffList.length;
    const salaryBudget = staffList.reduce((sum: number, s: any) => sum + Number(s.salary || 0), 0);
    const salaryPaid = payrollsMonth._sum.amount || 0;
    const salaryPending = Math.max(0, salaryBudget - salaryPaid);

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
        totalIncome: overallTotalIncome,
        totalExpenses: overallTotalExpenses,
        currentBalance: netBalance,
        netBalance,
        thisMonthDonations: thisMonthInflows,
        monthIncome: monthIncome._sum.amount || 0,
        memberCollectionTotal: memberCollectionsSum,
        recurringDonationsActive: recurringDonationsActive._count || 0,
        recurringMonthlyTotal: recurringDonationsActive._sum.amount || 0,
        memberCount: totalMembersCount,
        staffCount: activeStaffCount,
        monthlyPayroll: salaryPaid,
      },
      memberOverview: {
        totalMembers: totalMembersCount,
        paidMembers: paidMembersCount,
        pendingMembers: pendingMembersCount,
        completionRate,
        expected: members.reduce((sum: number, m: any) => sum + Number(m.monthlyAmount || 0), 0),
        collected: memberCollectionsSum,
        pending: pendingMembersCount * 100,
      },
      payrollOverview: {
        activeStaff: activeStaffCount,
        salaryBudget,
        salaryPaid,
        salaryPending,
      },
      charts: {
        monthlyTrend,
        donationCategories: donationCategories.map((c) => ({ id: c.id, name: c.name })),
        expenseCategories: expenseCategories.map((c) => ({ id: c.id, name: c.name })),
      },
      recentDonations,
      recentExpenses,
      recentIncomes,
      insights,
    });
  } catch (error: any) {
    console.error('Dashboard Stats API error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}

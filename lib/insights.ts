import { prisma } from './prisma';

export interface FinancialInsight {
  id: string;
  type: 'POSITIVE' | 'WARNING' | 'NEUTRAL' | 'INFO';
  title: string;
  description: string;
}

export async function generateFinancialInsights(masjidId: string): Promise<FinancialInsight[]> {
  const insights: FinancialInsight[] = [];

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // 1. Current vs Previous Month Donations
  const currentMonthDonations = await prisma.donation.aggregate({
    where: { masjidId, isVoided: false, date: { gte: currentMonthStart } },
    _sum: { amount: true },
  });

  const prevMonthDonations = await prisma.donation.aggregate({
    where: { masjidId, isVoided: false, date: { gte: prevMonthStart, lte: prevMonthEnd } },
    _sum: { amount: true },
  });

  const currDonVal = currentMonthDonations._sum.amount || 0;
  const prevDonVal = prevMonthDonations._sum.amount || 0;

  if (prevDonVal > 0) {
    const diffPct = Math.round(((currDonVal - prevDonVal) / prevDonVal) * 100);
    if (diffPct >= 0) {
      insights.push({
        id: 'donations-growth',
        type: 'POSITIVE',
        title: 'Donation Growth',
        description: `Donations increased ${diffPct}% compared with last month.`,
      });
    } else {
      insights.push({
        id: 'donations-decline',
        type: 'WARNING',
        title: 'Donation Dip',
        description: `Donations are ${Math.abs(diffPct)}% lower compared to last month.`,
      });
    }
  }

  // 2. Active Recurring Donations Projection
  const activeRecurring = await prisma.recurringDonation.findMany({
    where: { masjidId, status: 'ACTIVE' },
  });

  const monthlyRecurringExpected = activeRecurring.reduce((sum, rec) => {
    let monthlyVal = rec.amount;
    if (rec.frequency === 'DAILY') monthlyVal = rec.amount * 30;
    else if (rec.frequency === 'WEEKLY') monthlyVal = rec.amount * 4;
    else if (rec.frequency === 'QUARTERLY') monthlyVal = rec.amount / 3;
    else if (rec.frequency === 'YEARLY') monthlyVal = rec.amount / 12;
    return sum + monthlyVal;
  }, 0);

  if (monthlyRecurringExpected > 0) {
    insights.push({
      id: 'recurring-projection',
      type: 'INFO',
      title: 'Recurring Projection',
      description: `₹${monthlyRecurringExpected.toLocaleString('en-IN')} in recurring donations are expected next month.`,
    });
  }

  // 3. Campaign Progress Insight
  const activeCampaigns = await prisma.campaign.findMany({
    where: { masjidId, status: 'ACTIVE' },
  });

  for (const campaign of activeCampaigns) {
    if (campaign.targetAmount > 0) {
      const pct = Math.round((campaign.collectedAmount / campaign.targetAmount) * 100);
      insights.push({
        id: `campaign-${campaign.id}`,
        type: pct >= 50 ? 'POSITIVE' : 'NEUTRAL',
        title: campaign.name,
        description: `Campaign is ${pct}% toward its target goal of ₹${campaign.targetAmount.toLocaleString('en-IN')}.`,
      });
    }
  }

  // 4. Largest Expense Category this month
  const expensesThisMonth = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: { masjidId, isVoided: false, date: { gte: currentMonthStart } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 1,
  });

  if (expensesThisMonth.length > 0 && expensesThisMonth[0].categoryId) {
    const category = await prisma.expenseCategory.findUnique({
      where: { id: expensesThisMonth[0].categoryId },
    });
    if (category) {
      const topAmount = expensesThisMonth[0]._sum.amount || 0;
      insights.push({
        id: 'top-expense-category',
        type: 'NEUTRAL',
        title: 'Primary Overhead',
        description: `Your largest expense category this month is ${category.name} (₹${topAmount.toLocaleString('en-IN')}).`,
      });
    }
  }

  // Fallback insight if low data
  if (insights.length === 0) {
    insights.push({
      id: 'welcome-insight',
      type: 'INFO',
      title: 'Financial System Active',
      description: 'Record your latest donations and expenses to unlock real-time financial health analytics.',
    });
  }

  return insights;
}

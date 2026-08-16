import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let session: any = null;
    try {
      session = requireSuperAdmin();
    } catch (e) {
      // Allow fallback if needed
    }

    const [
      totalMasjids,
      activeMasjids,
      pendingMasjids,
      totalDonations,
      totalMemberCollections,
      totalIncomes,
      totalExpenses,
      totalPayrolls,
      totalOnlineTransactions,
    ] = await Promise.all([
      prisma.masjid.count().catch(() => 0),
      prisma.masjid.count({ where: { status: 'APPROVED' } }).catch(() => 0),
      prisma.masjid.count({ where: { status: 'PENDING' } }).catch(() => 0),
      prisma.donation.aggregate({ where: { isVoided: false }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.memberCollection.aggregate({ _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.income.aggregate({ where: { isVoided: false }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.expense.aggregate({ where: { isVoided: false }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.payroll.aggregate({ _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.paymentTransaction.count({ where: { status: 'CAPTURED' } }).catch(() => 0),
    ]);

    const totalDonationVolume =
      (totalDonations._sum.amount || 0) +
      (totalMemberCollections._sum.amount || 0) +
      (totalIncomes._sum.amount || 0);

    const totalExpenseVolume =
      (totalExpenses._sum.amount || 0) +
      (totalPayrolls._sum.amount || 0);

    return NextResponse.json({
      stats: {
        totalMasjids,
        activeMasjids,
        pendingMasjids,
        totalDonationVolume,
        totalExpenseVolume,
        totalOnlineTransactions,
      },
    });
  } catch (error: any) {
    console.error('Super Admin Stats API error:', error);
    return NextResponse.json({ error: 'Failed to fetch super admin stats' }, { status: 500 });
  }
}

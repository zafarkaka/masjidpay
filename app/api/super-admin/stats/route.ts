import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/tenant';

export async function GET() {
  try {
    requireSuperAdmin();

    const [
      totalMasjids,
      activeMasjids,
      pendingMasjids,
      totalDonations,
      totalExpenses,
      totalOnlineTransactions,
    ] = await Promise.all([
      prisma.masjid.count(),
      prisma.masjid.count({ where: { status: 'APPROVED' } }),
      prisma.masjid.count({ where: { status: 'PENDING' } }),
      prisma.donation.aggregate({ where: { isVoided: false }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { isVoided: false }, _sum: { amount: true } }),
      prisma.paymentTransaction.count({ where: { status: 'CAPTURED' } }),
    ]);

    return NextResponse.json({
      stats: {
        totalMasjids,
        activeMasjids,
        pendingMasjids,
        totalDonationVolume: totalDonations._sum.amount || 0,
        totalExpenseVolume: totalExpenses._sum.amount || 0,
        totalOnlineTransactions,
      },
    });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch super admin stats' }, { status: 500 });
  }
}

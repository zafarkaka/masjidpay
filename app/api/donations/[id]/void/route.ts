import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { voidReason } = await req.json();
    const donationId = params.id;

    const existing = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { donor: true, fund: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    const session = requireTenantAccess(existing.masjidId);

    if (existing.isVoided) {
      return NextResponse.json({ error: 'Donation is already voided' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark voided
      const updated = await tx.donation.update({
        where: { id: donationId },
        data: {
          isVoided: true,
          voidReason: voidReason || 'Voided by administrator',
        },
      });

      // 2. Reverse fund balance
      await tx.fund.update({
        where: { id: existing.fundId },
        data: { currentBalance: { decrement: existing.amount } },
      });

      // 3. Decrement donor lifetime contribution if linked
      if (existing.donorId) {
        await tx.donor.update({
          where: { id: existing.donorId },
          data: { totalDonated: { decrement: existing.amount } },
        });
      }

      // 4. Decrement campaign if linked
      if (existing.campaignId) {
        await tx.campaign.update({
          where: { id: existing.campaignId },
          data: { collectedAmount: { decrement: existing.amount } },
        });
      }

      return updated;
    });

    await recordAuditLog({
      masjidId: existing.masjidId,
      userId: session.userId,
      userEmail: session.email,
      userRole: session.role,
      action: 'DONATION_VOID',
      entity: 'Donation',
      entityId: donationId,
      beforeState: { amount: existing.amount, isVoided: false },
      afterState: { isVoided: true, voidReason },
    });

    return NextResponse.json({ success: true, donation: result });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Void Donation API error:', error);
    return NextResponse.json({ error: 'Failed to void donation' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    const session = requireTenantAccess(masjidIdParam);
    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session.masjidId || '' },
          { id: masjidIdParam || '' },
          { slug: masjidIdParam || 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    const recurring = await prisma.recurringDonation.findMany({
      where: { masjidId: masjid.id },
      include: {
        donor: true,
        category: true,
        fund: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ recurring });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch recurring donations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      masjidId: reqMasjidId,
      donorName,
      donorPhone,
      donorEmail,
      amount,
      frequency,
      categoryId: reqCatId,
      fundId: reqFundId,
      startDate,
      paymentMethod,
    } = body;

    if (!donorName || !amount) {
      return NextResponse.json({ error: 'donorName and amount are required' }, { status: 400 });
    }

    const session = requireTenantAccess(reqMasjidId);
    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session.masjidId || '' },
          { id: reqMasjidId || '' },
          { slug: reqMasjidId || 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    let categoryId = reqCatId;
    if (!categoryId || categoryId === 'default-cat') {
      const firstCat = await prisma.donationCategory.findFirst({ where: { masjidId: masjid.id } });
      categoryId = firstCat?.id;
    }

    let fundId = reqFundId;
    if (!fundId || fundId === 'default-fund') {
      const firstFund = await prisma.fund.findFirst({ where: { masjidId: masjid.id } });
      fundId = firstFund?.id;
    }

    if (!categoryId || !fundId) {
      return NextResponse.json({ error: 'Valid category and fund are required' }, { status: 400 });
    }

    let donor = await prisma.donor.findFirst({
      where: { masjidId: masjid.id, name: donorName },
    });

    if (!donor) {
      donor = await prisma.donor.create({
        data: {
          masjidId: masjid.id,
          name: donorName,
          phone: donorPhone || null,
          email: donorEmail || null,
        },
      });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const nextPayment = new Date(start);
    if (frequency === 'DAILY') nextPayment.setDate(nextPayment.getDate() + 1);
    else if (frequency === 'WEEKLY') nextPayment.setDate(nextPayment.getDate() + 7);
    else if (frequency === 'QUARTERLY') nextPayment.setMonth(nextPayment.getMonth() + 3);
    else if (frequency === 'YEARLY') nextPayment.setFullYear(nextPayment.getFullYear() + 1);
    else nextPayment.setMonth(nextPayment.getMonth() + 1);

    const recurring = await prisma.recurringDonation.create({
      data: {
        masjidId: masjid.id,
        donorId: donor.id,
        categoryId,
        fundId,
        amount: Number(amount),
        frequency: frequency || 'MONTHLY',
        startDate: start,
        nextPaymentDate: nextPayment,
        paymentMethod: paymentMethod || 'RAZORPAY',
        status: 'ACTIVE',
        razorpaySubscriptionId: `sub_${Math.random().toString(36).substring(2, 10)}`,
      },
      include: {
        donor: true,
        category: true,
        fund: true,
      },
    });

    if (session) {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session.userId,
        userEmail: session.email,
        userRole: session.role,
        action: 'RECURRING_DONATION_CREATE',
        entity: 'RecurringDonation',
        entityId: recurring.id,
        afterState: { donorName, amount, frequency },
      });
    }

    return NextResponse.json({ success: true, recurring });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Create Recurring Donation API error:', error);
    return NextResponse.json({ error: 'Failed to create recurring donation' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const existing = await prisma.recurringDonation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Recurring donation not found' }, { status: 404 });
    }

    const session = requireTenantAccess(existing.masjidId);

    const updated = await prisma.recurringDonation.update({
      where: { id },
      data: { status },
    });

    await recordAuditLog({
      masjidId: existing.masjidId,
      userId: session.userId,
      userEmail: session.email,
      userRole: session.role,
      action: 'RECURRING_DONATION_STATUS_CHANGE',
      entity: 'RecurringDonation',
      entityId: id,
      beforeState: { status: existing.status },
      afterState: { status },
    });

    return NextResponse.json({ success: true, recurring: updated });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update recurring donation' }, { status: 500 });
  }
}

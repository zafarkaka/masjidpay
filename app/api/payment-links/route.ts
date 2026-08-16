import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { razorpay } from '@/lib/payments/razorpay';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    const session = requireTenantAccess(masjidIdParam);
    
    // Resolve masjid by ID or Slug or Session
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

    const paymentLinks = await prisma.paymentLink.findMany({
      where: { masjidId: masjid.id },
      include: { category: true, campaign: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ paymentLinks });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Payment Links GET API error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment links' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { masjidId: reqMasjidId, title, amount, categoryId: reqCatId, campaignId, isCustomAmount } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
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

    if (!categoryId) {
      return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
    }

    // Call Razorpay Service
    const rzpResult = await razorpay.createPaymentLink({
      title,
      amount: amount ? Number(amount) : undefined,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/donate/${masjid.slug}`,
    });

    const paymentLink = await prisma.paymentLink.create({
      data: {
        masjidId: masjid.id,
        razorpayLinkId: rzpResult.id,
        linkUrl: rzpResult.short_url,
        title,
        amount: amount ? Number(amount) : null,
        categoryId,
        campaignId: campaignId || null,
        isCustomAmount: isCustomAmount !== undefined ? Boolean(isCustomAmount) : true,
        status: 'ACTIVE',
      },
      include: { category: true, campaign: true },
    });

    if (session) {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session.userId,
        userEmail: session.email,
        userRole: session.role,
        action: 'PAYMENT_LINK_CREATE',
        entity: 'PaymentLink',
        entityId: paymentLink.id,
        afterState: { title, linkUrl: paymentLink.linkUrl, amount },
      });
    }

    return NextResponse.json({ success: true, paymentLink });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Create Payment Link API error:', error);
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
}

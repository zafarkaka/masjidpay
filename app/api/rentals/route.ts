import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, requireTenantWriteAccess, getOrResolveMasjid } from '@/lib/tenant';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);

    if (!masjid) {
      return NextResponse.json({ shops: [], payments: [] });
    }

    const [shops, payments] = await Promise.all([
      prisma.rentalShop.findMany({ where: { masjidId: masjid.id }, orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.rentalPayment.findMany({ where: { masjidId: masjid.id }, orderBy: { paymentDate: 'desc' } }).catch(() => []),
    ]);

    return NextResponse.json({ shops: shops || [], payments: payments || [] });
  } catch (error: any) {
    console.error('Failed to fetch rental data:', error);
    return NextResponse.json({ shops: [], payments: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, masjidId: reqMasjidId, shopNo, tenantName, tenantPhone, monthlyRent, shopId, amount, forMonth, paymentMethod } = body;

    let session: any = null;
    try {
      session = requireTenantWriteAccess(reqMasjidId);
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message || 'Read-Only Mode: Guests cannot manage rentals.' },
        { status: 403 }
      );
    }

    const masjid = await getOrResolveMasjid(session?.masjidId, reqMasjidId);

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    if (action === 'ADD_SHOP') {
      const shop = await prisma.rentalShop.create({
        data: {
          masjidId: masjid.id,
          shopNo,
          tenantName,
          tenantPhone,
          monthlyRent: Number(monthlyRent),
          status: 'OCCUPIED',
        },
      });
      return NextResponse.json({ success: true, shop });
    } else {
      // RECORD RENTAL PAYMENT
      const shop = await prisma.rentalShop.findUnique({ where: { id: shopId } });
      if (!shop) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }

      const receiptCount = await prisma.receipt.count({ where: { masjidId: masjid.id } });
      const receiptNo = `RNT-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(4, '0')}`;

      const payment = await prisma.rentalPayment.create({
        data: {
          masjidId: masjid.id,
          shopId,
          shopNo: shop.shopNo,
          tenantName: shop.tenantName,
          amount: Number(amount || shop.monthlyRent),
          forMonth: forMonth || 'August 2026',
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          receiptNo,
        },
      });

      // Record as Income entry
      const catGeneral = await prisma.donationCategory.findFirst({ where: { masjidId: masjid.id } });
      const fundGeneral = await prisma.fund.findFirst({ where: { masjidId: masjid.id } });

      if (catGeneral && fundGeneral) {
        await prisma.donation.create({
          data: {
            masjidId: masjid.id,
            donorId: null,
            categoryId: catGeneral.id,
            fundId: fundGeneral.id,
            amount: Number(amount || shop.monthlyRent),
            date: new Date(),
            paymentMethod: paymentMethod || 'BANK_TRANSFER',
            referenceNo: receiptNo,
            notes: `Rent Payment - ${shop.shopNo} (${forMonth})`,
            receiptNo,
          },
        });

        await prisma.fund.update({
          where: { id: fundGeneral.id },
          data: { currentBalance: { increment: Number(amount || shop.monthlyRent) } },
        });
      }

      return NextResponse.json({ success: true, payment });
    }
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to save rental record' }, { status: 500 });
  }
}

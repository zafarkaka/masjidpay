import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { generateWhatsAppInvoiceUrl } from '@/lib/whatsapp';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

async function getOrCreateMasjid(sessionMasjidId?: string, reqMasjidId?: string) {
  let masjid = null;
  try {
    masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: sessionMasjidId || 'none' },
          { id: reqMasjidId || 'none' },
          { slug: reqMasjidId || 'none' },
          { slug: 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      masjid = await prisma.masjid.findFirst();
    }

    if (!masjid) {
      masjid = await prisma.masjid.create({
        data: {
          name: 'Jama Masjid Vaniyambadi',
          slug: 'jama-masjid',
          city: 'Vaniyambadi',
          state: 'Tamil Nadu',
          country: 'IN',
          status: 'APPROVED',
          currency: 'INR',
        },
      });
    }
  } catch (err) {
    console.error('Error finding or creating masjid:', err);
  }
  return masjid;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');
    const query = searchParams.get('q');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {
      // fallback
    }

    const masjid = await getOrCreateMasjid(session?.masjidId, masjidIdParam || undefined);

    if (!masjid) {
      return NextResponse.json({ collections: [], masjidName: 'Jama Masjid Vaniyambadi' });
    }

    const where: any = { masjidId: masjid.id };
    if (query) {
      where.OR = [
        { memberName: { contains: query } },
        { memberPhone: { contains: query } },
        { receiptNo: { contains: query } },
        { forMonths: { contains: query } },
      ];
    }

    const collections = await prisma.memberCollection.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json({ collections: collections || [], masjidName: masjid.name });
  } catch (error: any) {
    console.error('Member Collections GET API error:', error);
    return NextResponse.json({ collections: [], masjidName: 'Jama Masjid' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      masjidId: reqMasjidId,
      memberId,
      memberName,
      memberPhone,
      memberAddress,
      amount,
      paymentType,
      monthsCount: reqMonthsCount,
      forMonths,
      paymentDate: reqPaymentDate,
      paymentMethod,
      referenceNo,
      notes,
    } = body;

    if (!memberName || !memberPhone || !amount) {
      return NextResponse.json({ error: 'Member name, phone, and amount are required' }, { status: 400 });
    }

    let session: any = null;
    try {
      session = requireTenantAccess(reqMasjidId);
    } catch (e) {
      // fallback
    }

    const masjid = await getOrCreateMasjid(session?.masjidId, reqMasjidId);

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid record could not be initialized' }, { status: 500 });
    }

    const receiptNo = `MC-${Date.now().toString().slice(-6)}`;
    const parsedAmount = Number(amount);
    const monthsCount = Number(reqMonthsCount || 1);
    const paymentDate = reqPaymentDate ? new Date(reqPaymentDate) : new Date();

    const collection = await prisma.memberCollection.create({
      data: {
        masjidId: masjid.id,
        memberId: memberId || null,
        memberName: memberName.trim(),
        memberPhone: memberPhone.trim(),
        memberAddress: memberAddress || null,
        amount: parsedAmount,
        paymentType: paymentType || 'MONTHLY',
        monthsCount,
        forMonths: forMonths || null,
        paymentDate,
        paymentMethod: paymentMethod || 'CASH',
        referenceNo: referenceNo || null,
        receiptNo,
        notes: notes || null,
      },
    });

    const whatsappUrl = generateWhatsAppInvoiceUrl({
      phone: memberPhone,
      memberName: memberName,
      amount: parsedAmount,
      monthsCount,
      forMonths: forMonths || 'Current Month',
      receiptNo,
      masjidName: masjid.name,
      paymentDate: paymentDate.toLocaleDateString('en-IN'),
      transparencyUrl: `https://masjidpay.org/masjid/${masjid.slug}/transparency`,
    });

    return NextResponse.json({
      success: true,
      collection,
      receiptNo,
      whatsappUrl,
    });
  } catch (error: any) {
    console.error('Create member collection error:', error);
    return NextResponse.json({ error: 'Failed to record collection' }, { status: 500 });
  }
}

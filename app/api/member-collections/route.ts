import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { generateWhatsAppInvoiceUrl } from '@/lib/whatsapp';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const month = searchParams.get('month');

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

    return NextResponse.json({ collections, masjidName: masjid.name });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Member Collections GET API error:', error);
    return NextResponse.json({ error: 'Failed to fetch member collections' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      masjidId: reqMasjidId,
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

    const numAmount = Number(amount);
    const monthsCount = paymentType === 'BULK_12_MONTHS' ? 12 : Number(reqMonthsCount || 1);
    const pDate = reqPaymentDate ? new Date(reqPaymentDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      let member = await tx.member.findFirst({
        where: { masjidId: masjid.id, phone: memberPhone },
      });

      if (!member) {
        member = await tx.member.create({
          data: {
            masjidId: masjid.id,
            name: memberName,
            phone: memberPhone,
            address: memberAddress || null,
            monthlyAmount: paymentType === 'BULK_12_MONTHS' ? Math.round(numAmount / 12) : numAmount,
          },
        });
      }

      const receiptCount = await tx.receipt.count({ where: { masjidId: masjid.id } });
      const receiptNo = `REC-${pDate.getFullYear()}-${String(receiptCount + 1).padStart(4, '0')}`;

      const collection = await tx.memberCollection.create({
        data: {
          masjidId: masjid.id,
          memberId: member.id,
          memberName,
          memberPhone,
          memberAddress: memberAddress || null,
          amount: numAmount,
          paymentType: paymentType || 'MONTHLY',
          monthsCount,
          forMonths: forMonths || (paymentType === 'BULK_12_MONTHS' ? 'Annual (12 Months)' : 'Single Month'),
          paymentDate: pDate,
          paymentMethod: paymentMethod || 'CASH',
          referenceNo: referenceNo || null,
          receiptNo,
          notes: notes || null,
        },
      });

      const firstCat = await tx.donationCategory.findFirst({ where: { masjidId: masjid.id } });
      const firstFund = await tx.fund.findFirst({ where: { masjidId: masjid.id } });

      if (firstCat && firstFund) {
        const donation = await tx.donation.create({
          data: {
            masjidId: masjid.id,
            donorId: null,
            categoryId: firstCat.id,
            fundId: firstFund.id,
            amount: numAmount,
            date: pDate,
            paymentMethod: paymentMethod || 'CASH',
            referenceNo: referenceNo || null,
            notes: `Member Collection - ${memberName} (${forMonths || `${monthsCount} mo`})`,
            receiptNo,
          },
        });

        await tx.fund.update({
          where: { id: firstFund.id },
          data: { currentBalance: { increment: numAmount } },
        });

        await tx.receipt.create({
          data: {
            masjidId: masjid.id,
            receiptNo,
            donationId: donation.id,
            donorName: memberName,
            amount: numAmount,
            categoryName: paymentType === 'ONE_TIME' ? 'One-Time Donation' : 'Monthly Member Collection',
          },
        });
      }

      return collection;
    });

    const whatsappUrl = generateWhatsAppInvoiceUrl({
      phone: memberPhone,
      memberName,
      amount: numAmount,
      monthsCount,
      forMonths: result.forMonths || undefined,
      paymentDate: pDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      receiptNo: result.receiptNo || 'REC-2026-0001',
      masjidName: masjid.name,
      paymentMethod: paymentMethod || 'CASH',
    });

    if (session) {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session.userId,
        userEmail: session.email,
        userRole: session.role,
        action: 'MEMBER_COLLECTION_CREATE',
        entity: 'MemberCollection',
        entityId: result.id,
        afterState: { memberName, memberPhone, amount: numAmount, paymentType, monthsCount, receiptNo: result.receiptNo },
      });
    }

    return NextResponse.json({
      success: true,
      collection: result,
      whatsappUrl,
    });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Create Member Collection API error:', error);
    return NextResponse.json({ error: 'Failed to record member collection' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, memberName, memberPhone, memberAddress, amount, forMonths, paymentMethod, paymentDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'Collection id is required' }, { status: 400 });
    }

    const updated = await prisma.memberCollection.update({
      where: { id },
      data: {
        memberName: memberName || undefined,
        memberPhone: memberPhone || undefined,
        memberAddress: memberAddress || undefined,
        amount: amount !== undefined ? Number(amount) : undefined,
        forMonths: forMonths || undefined,
        paymentMethod: paymentMethod || undefined,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
      },
    });

    return NextResponse.json({ success: true, collection: updated });
  } catch (error: any) {
    console.error('Update Member Collection error:', error);
    return NextResponse.json({ error: 'Failed to update collection record' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Collection id is required' }, { status: 400 });
    }

    await prisma.memberCollection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Collection record deleted successfully' });
  } catch (error: any) {
    console.error('Delete Member Collection error:', error);
    return NextResponse.json({ error: 'Failed to delete collection record' }, { status: 500 });
  }
}

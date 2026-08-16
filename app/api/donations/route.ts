import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');
    const categoryId = searchParams.get('categoryId');
    const paymentMethod = searchParams.get('paymentMethod');
    const query = searchParams.get('q');

    const session = requireTenantAccess(masjidIdParam);
    const masjidId = session.masjidId || masjidIdParam || (await prisma.masjid.findFirst({ where: { status: 'APPROVED' } }))?.id;

    if (!masjidId) {
      return NextResponse.json({ error: 'masjidId is required' }, { status: 400 });
    }

    const where: any = { masjidId };
    if (categoryId && categoryId !== 'ALL') where.categoryId = categoryId;
    if (paymentMethod && paymentMethod !== 'ALL') where.paymentMethod = paymentMethod;

    if (query) {
      where.OR = [
        { referenceNo: { contains: query } },
        { notes: { contains: query } },
        { donor: { name: { contains: query } } },
      ];
    }

    const donations = await prisma.donation.findMany({
      where,
      include: {
        donor: true,
        category: true,
        fund: true,
        campaign: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ donations });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Donations GET API error:', error);
    return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
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
      categoryId: reqCatId,
      fundId: reqFundId,
      campaignId,
      paymentMethod,
      referenceNo,
      notes,
      isAnonymous,
      date,
    } = body;

    const session = requireTenantAccess(reqMasjidId);
    const masjidId = session.masjidId || reqMasjidId || (await prisma.masjid.findFirst({ where: { status: 'APPROVED' } }))?.id;

    if (!masjidId || !amount) {
      return NextResponse.json({ error: 'masjidId and amount are required' }, { status: 400 });
    }

    // Resolve categoryId and fundId if default strings sent
    let categoryId = reqCatId;
    if (!categoryId || categoryId === 'default-cat') {
      const firstCat = await prisma.donationCategory.findFirst({ where: { masjidId } });
      categoryId = firstCat?.id;
    }

    let fundId = reqFundId;
    if (!fundId || fundId === 'default-fund') {
      const firstFund = await prisma.fund.findFirst({ where: { masjidId } });
      fundId = firstFund?.id;
    }

    if (!categoryId || !fundId) {
      return NextResponse.json({ error: 'Valid category and fund are required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Link or create donor if donorName provided
      let donorId: string | undefined;
      if (donorName && !isAnonymous) {
        let donor = await tx.donor.findFirst({
          where: { masjidId, name: donorName },
        });
        if (!donor) {
          donor = await tx.donor.create({
            data: {
              masjidId,
              name: donorName,
              phone: donorPhone || null,
              email: donorEmail || null,
              totalDonated: Number(amount),
            },
          });
        } else {
          await tx.donor.update({
            where: { id: donor.id },
            data: { totalDonated: { increment: Number(amount) } },
          });
        }
        donorId = donor.id;
      }

      // 2. Generate Receipt Sequence Number
      const receiptCount = await tx.receipt.count({ where: { masjidId } });
      const receiptNo = `REC-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(4, '0')}`;

      // 3. Create Donation Record
      const donation = await tx.donation.create({
        data: {
          masjidId,
          donorId: donorId || null,
          categoryId,
          fundId,
          campaignId: campaignId || null,
          amount: Number(amount),
          date: date ? new Date(date) : new Date(),
          paymentMethod: paymentMethod || 'CASH',
          referenceNo: referenceNo || null,
          notes: notes || null,
          isAnonymous: Boolean(isAnonymous),
          receiptNo,
        },
        include: {
          donor: true,
          category: true,
          fund: true,
          campaign: true,
        },
      });

      // 4. Update Fund Current Balance
      await tx.fund.update({
        where: { id: fundId },
        data: { currentBalance: { increment: Number(amount) } },
      });

      // 5. Update Campaign collected amount if campaign attached
      if (campaignId) {
        await tx.campaign.update({
          where: { id: campaignId },
          data: { collectedAmount: { increment: Number(amount) } },
        });
      }

      // 6. Generate Receipt Record
      await tx.receipt.create({
        data: {
          masjidId,
          receiptNo,
          donationId: donation.id,
          donorName: isAnonymous ? 'Anonymous Donor' : donorName || 'Valued Donor',
          amount: Number(amount),
          categoryName: donation.category.name,
        },
      });

      return donation;
    });

    if (session) {
      await recordAuditLog({
        masjidId,
        userId: session.userId,
        userEmail: session.email,
        userRole: session.role,
        action: 'DONATION_CREATE',
        entity: 'Donation',
        entityId: result.id,
        afterState: { amount, donorName, paymentMethod, receiptNo: result.receiptNo },
      });
    }

    return NextResponse.json({ success: true, donation: result });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Create Donation API error:', error);
    return NextResponse.json({ error: 'Failed to record donation' }, { status: 500 });
  }
}

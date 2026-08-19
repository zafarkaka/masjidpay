import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDonationReceiptEmail } from '@/lib/email';
import { generateWhatsAppDonationReceiptUrl } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      slug,
      masjidId: rawMasjidId,
      amount,
      donorName,
      donorEmail,
      donorPhone,
      categoryName,
      paymentMethod = 'UPI',
      referenceNo,
      isAnonymous = false,
    } = body;

    const mosqueIdentifier = slug || rawMasjidId;
    if (!mosqueIdentifier) {
      return NextResponse.json({ error: 'Mosque slug or identifier is required' }, { status: 400 });
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Please enter a valid donation amount' }, { status: 400 });
    }

    // 1. Locate Mosque & Verify Approval Status
    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { slug: mosqueIdentifier },
          { id: mosqueIdentifier },
        ],
      },
      include: {
        donationCategories: true,
        funds: true,
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Mosque not found' }, { status: 404 });
    }

    if (masjid.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'This mosque is currently undergoing Super Admin verification and is not yet open for public donations.' },
        { status: 403 }
      );
    }

    const masjidId = masjid.id;
    const finalDonorName = isAnonymous ? 'Anonymous Donor' : (donorName?.trim() || 'Devoted Donor');
    const finalDonorPhone = donorPhone?.trim() || '';
    const finalDonorEmail = donorEmail?.trim().toLowerCase() || '';

    // 2. Resolve Category & Fund
    let category = masjid.donationCategories.find(
      (c) => c.name.toLowerCase() === (categoryName || '').toLowerCase()
    );

    if (!category) {
      category = masjid.donationCategories[0] || (await prisma.donationCategory.create({
        data: {
          masjidId,
          name: categoryName || 'General Donation',
        },
      }));
    }

    let fund = masjid.funds[0];
    if (!fund) {
      fund = await prisma.fund.create({
        data: {
          masjidId,
          name: 'General Mosque Fund',
        },
      });
    }

    // 3. Resolve / Upsert Donor
    let donorId: string | null = null;
    if (!isAnonymous && (finalDonorPhone || finalDonorEmail)) {
      const existingDonor = await prisma.donor.findFirst({
        where: {
          masjidId,
          OR: [
            ...(finalDonorPhone ? [{ phone: finalDonorPhone }] : []),
            ...(finalDonorEmail ? [{ email: finalDonorEmail }] : []),
          ],
        },
      });

      if (existingDonor) {
        donorId = existingDonor.id;
      } else {
        const newDonor = await prisma.donor.create({
          data: {
            masjidId,
            name: finalDonorName,
            phone: finalDonorPhone || null,
            email: finalDonorEmail || null,
          },
        });
        donorId = newDonor.id;
      }
    }

    // 4. Generate Unique Receipt Number
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const timeCode = Date.now().toString().slice(-6);
    const receiptNo = `MP-REC-${timeCode}-${randomSuffix}`;
    const dateFormatted = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // 5. Create Donation & Receipt in Database
    let donation: any = null;
    try {
      donation = await prisma.donation.create({
        data: {
          masjidId,
          donorId,
          categoryId: category.id,
          fundId: fund.id,
          amount: Number(amount),
          paymentMethod: paymentMethod.toUpperCase(),
          referenceNo: referenceNo || `REF-${timeCode}`,
          receiptNo,
          isAnonymous: Boolean(isAnonymous),
          notes: `Public website donation for ${category.name}`,
        },
        include: {
          category: true,
          fund: true,
        },
      });

      await prisma.receipt.create({
        data: {
          masjidId,
          donationId: donation.id,
          receiptNo,
          amount: Number(amount),
          donorName: finalDonorName,
          categoryName: category.name,
        },
      });
    } catch (dbErr) {
      console.error('Failed to create donation record in DB:', dbErr);
    }

    // 6. Generate Official WhatsApp Receipt URL
    let whatsappUrl: string | null = null;
    if (finalDonorPhone) {
      whatsappUrl = generateWhatsAppDonationReceiptUrl({
        phone: finalDonorPhone,
        donorName: finalDonorName,
        amount: Number(amount),
        categoryName: category.name,
        paymentDate: dateFormatted,
        receiptNo,
        masjidName: masjid.name,
        paymentMethod: paymentMethod.toUpperCase(),
        referenceNo,
        transparencyUrl: `https://masjidpay.org/masjid/${masjid.slug}/transparency`,
      });
    }

    // 7. Auto-Dispatch Email Receipt if email is provided
    let emailSent = false;
    if (finalDonorEmail && finalDonorEmail.includes('@')) {
      try {
        const emailRes = await sendDonationReceiptEmail({
          toEmail: finalDonorEmail,
          donorName: finalDonorName,
          masjidName: masjid.name,
          masjidSlug: masjid.slug,
          amount: Number(amount),
          categoryName: category.name,
          receiptNo,
          paymentMethod: paymentMethod.toUpperCase(),
          referenceNo,
          date: dateFormatted,
        });
        emailSent = Boolean(emailRes?.sent);
      } catch (emailErr) {
        console.error('Email dispatch error:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      donation: donation || {
        id: `don_${timeCode}`,
        receiptNo,
        amount: Number(amount),
        donorName: finalDonorName,
        paymentMethod: paymentMethod.toUpperCase(),
        category: { name: category.name },
        createdAt: new Date().toISOString(),
      },
      receiptNo,
      masjidName: masjid.name,
      whatsappUrl,
      emailSent,
      donorEmail: finalDonorEmail,
      donorPhone: finalDonorPhone,
    });
  } catch (error: any) {
    console.error('Public Donation API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process public donation' }, { status: 500 });
  }
}

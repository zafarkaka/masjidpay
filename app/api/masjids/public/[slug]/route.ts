import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params?.slug;
    if (!slug) {
      return NextResponse.json({ error: 'Mosque slug is required' }, { status: 400 });
    }

    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        state: true,
        country: true,
        address: true,
        upiId: true,
        bankName: true,
        bankAccNo: true,
        bankIfsc: true,
        logoUrl: true,
        waqfId: true,
        regNumber: true,
        status: true,
        settings: {
          where: {
            key: {
              in: [
                'upiId',
                'upiPayeeName',
                'enableUpi',
                'enableRazorpay',
                'bankName',
                'bankAccNo',
                'bankIfsc',
                'razorpayKeyId',
              ],
            },
          },
        },
        donationCategories: {
          select: { id: true, name: true },
        },
        campaigns: {
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, targetAmount: true, collectedAmount: true },
        },
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Mosque not found' }, { status: 404 });
    }

    // STRICT VERIFICATION CHECK: Only APPROVED masjids can receive public donations
    if (masjid.status !== 'APPROVED') {
      return NextResponse.json(
        {
          error: 'This Mosque is currently undergoing Super Admin verification and is not yet approved for public donations.',
          status: masjid.status,
          isApproved: false,
          name: masjid.name,
        },
        { status: 403 }
      );
    }

    const settingsMap: Record<string, string> = {};
    masjid.settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const activeUpiId = masjid.upiId || settingsMap['upiId'] || '';
    const activeUpiPayeeName = settingsMap['upiPayeeName'] || masjid.name;
    const activeBankName = masjid.bankName || settingsMap['bankName'] || '';
    const activeBankAccNo = masjid.bankAccNo || settingsMap['bankAccNo'] || '';
    const activeBankIfsc = masjid.bankIfsc || settingsMap['bankIfsc'] || '';
    const enableUpi = settingsMap['enableUpi'] !== 'false';
    const enableRazorpay = settingsMap['enableRazorpay'] === 'true';
    const razorpayKeyId = enableRazorpay ? (settingsMap['razorpayKeyId'] || '') : '';

    return NextResponse.json({
      success: true,
      masjid: {
        id: masjid.id,
        name: masjid.name,
        slug: masjid.slug,
        city: masjid.city,
        state: masjid.state,
        country: masjid.country,
        address: masjid.address,
        logoUrl: masjid.logoUrl,
        waqfId: masjid.waqfId,
        regNumber: masjid.regNumber,
        isVerified: true,
        status: masjid.status,
        upiId: activeUpiId,
        upiPayeeName: activeUpiPayeeName,
        bankName: activeBankName,
        bankAccNo: activeBankAccNo,
        bankIfsc: activeBankIfsc,
        enableUpi,
        enableRazorpay,
        razorpayKeyId,
        categories: masjid.donationCategories.length > 0
          ? masjid.donationCategories
          : [
              { id: 'gen', name: 'General Donation' },
              { id: 'zak', name: 'Zakat Fund' },
              { id: 'sad', name: 'Sadaqah' },
              { id: 'con', name: 'Construction & Renovation' },
              { id: 'mai', name: 'Masjid Maintenance' },
            ],
        campaigns: masjid.campaigns || [],
      },
    });
  } catch (error: any) {
    console.error('Public Mosque fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch mosque details' }, { status: 500 });
  }
}

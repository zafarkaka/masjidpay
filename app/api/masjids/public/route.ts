import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const city = searchParams.get('city') || '';

    const where: any = {
      status: 'APPROVED',
    };

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { city: { contains: query } },
        { state: { contains: query } },
      ];
    }

    if (city) {
      where.city = { contains: city };
    }

    const masjids = await prisma.masjid.findMany({
      where,
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
        logoUrl: true,
        waqfId: true,
        regNumber: true,
        status: true,
        createdAt: true,
        settings: {
          where: {
            key: {
              in: ['upiId', 'upiPayeeName', 'enableUpi', 'enableRazorpay', 'bankName', 'bankAccNo', 'bankIfsc'],
            },
          },
        },
        _count: {
          select: {
            donations: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const sanitizedMasjids = masjids.map((m) => {
      const settingsMap: Record<string, string> = {};
      m.settings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      return {
        id: m.id,
        name: m.name,
        slug: m.slug,
        city: m.city,
        state: m.state,
        country: m.country,
        address: m.address,
        logoUrl: m.logoUrl,
        waqfId: m.waqfId,
        regNumber: m.regNumber,
        isVerified: true,
        upiId: m.upiId || settingsMap['upiId'] || '',
        upiPayeeName: settingsMap['upiPayeeName'] || m.name,
        bankName: m.bankName || settingsMap['bankName'] || '',
        enableUpi: settingsMap['enableUpi'] !== 'false',
        enableRazorpay: settingsMap['enableRazorpay'] === 'true',
        donationCount: m._count.donations,
      };
    });

    return NextResponse.json({
      success: true,
      masjids: sanitizedMasjids,
    });
  } catch (error: any) {
    console.error('Public Masjids API error:', error);
    return NextResponse.json({ error: 'Failed to fetch public verified masjids' }, { status: 500 });
  }
}

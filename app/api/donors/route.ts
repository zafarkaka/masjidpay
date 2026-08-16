import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');
    const query = searchParams.get('q');

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
        { name: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
      ];
    }

    const donors = await prisma.donor.findMany({
      where,
      include: {
        _count: { select: { donations: true, recurringDonations: true } },
      },
      orderBy: { totalDonated: 'desc' },
    });

    return NextResponse.json({ donors });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch donors' }, { status: 500 });
  }
}

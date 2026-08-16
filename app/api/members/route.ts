import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

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

    const members = await prisma.member.findMany({
      where: { masjidId: masjid.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ members, masjidSlug: masjid.slug });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { masjidId: reqMasjidId, name, phone, email, address, monthlyAmount, joiningDate, canViewReports } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
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

    const memberCount = await prisma.member.count({ where: { masjidId: masjid.id } });
    const memberNo = `MBR-${String(memberCount + 1).padStart(3, '0')}`;

    const member = await prisma.member.create({
      data: {
        masjidId: masjid.id,
        memberNo,
        name,
        phone,
        email: email || null,
        address: address || null,
        monthlyAmount: Number(monthlyAmount || 500),
        canViewReports: canViewReports !== undefined ? Boolean(canViewReports) : true,
        createdAt: joiningDate ? new Date(joiningDate) : new Date(),
      },
    });

    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Create member error:', error);
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { memberId, canViewReports } = await req.json();
    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: { canViewReports: Boolean(canViewReports) },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    console.error('Update member permission error:', error);
    return NextResponse.json({ error: 'Failed to update member report access permission' }, { status: 500 });
  }
}

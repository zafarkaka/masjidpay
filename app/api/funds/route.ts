import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

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

    const funds = await prisma.fund.findMany({
      where: { masjidId: masjid.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ funds });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch funds' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { masjidId: reqMasjidId, name, description, openingBalance, isRestricted } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
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

    const initBalance = Number(openingBalance || 0);

    const fund = await prisma.fund.create({
      data: {
        masjidId: masjid.id,
        name,
        description: description || null,
        openingBalance: initBalance,
        currentBalance: initBalance,
        isRestricted: Boolean(isRestricted),
      },
    });

    await recordAuditLog({
      masjidId: masjid.id,
      userId: session.userId,
      userEmail: session.email,
      userRole: session.role,
      action: 'FUND_CREATE',
      entity: 'Fund',
      entityId: fund.id,
      afterState: { name, openingBalance: initBalance, isRestricted },
    });

    return NextResponse.json({ success: true, fund });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to create fund' }, { status: 500 });
  }
}

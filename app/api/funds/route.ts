import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, getOrResolveMasjid } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

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
      return NextResponse.json({ funds: [] });
    }

    const funds = await prisma.fund.findMany({
      where: { masjidId: masjid.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ funds: funds || [] });
  } catch (error: any) {
    console.error('Failed to fetch funds:', error);
    return NextResponse.json({ funds: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { masjidId: reqMasjidId, name, description, openingBalance, isRestricted } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    let session: any = null;
    try {
      session = requireTenantAccess(reqMasjidId);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, reqMasjidId);

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

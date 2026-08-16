import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');
    const status = searchParams.get('status');

    let masjid = null;
    if (masjidIdParam) {
      masjid = await prisma.masjid.findFirst({
        where: {
          OR: [
            { id: masjidIdParam },
            { slug: masjidIdParam },
          ],
        },
      });
    }

    const where: any = {};
    if (masjid) {
      where.masjidId = masjid.id;
    }
    if (status) {
      where.status = status;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        category: true,
        _count: { select: { donations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns: campaigns || [] });
  } catch (error: any) {
    console.error('Campaigns GET API error:', error);
    return NextResponse.json({ campaigns: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { masjidId: reqMasjidId, name, description, targetAmount, startDate, endDate, categoryId, imageUrl, status } = body;

    if (!name || !targetAmount) {
      return NextResponse.json({ error: 'name and targetAmount are required' }, { status: 400 });
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

    const campaign = await prisma.campaign.create({
      data: {
        masjidId: masjid.id,
        name,
        description: description || null,
        targetAmount: Number(targetAmount),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        categoryId: categoryId || null,
        imageUrl: imageUrl || null,
        status: status || 'ACTIVE',
      },
      include: { category: true },
    });

    if (session) {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session.userId,
        userEmail: session.email,
        userRole: session.role,
        action: 'CAMPAIGN_CREATE',
        entity: 'Campaign',
        entityId: campaign.id,
        afterState: { name, targetAmount },
      }).catch((e) => console.warn('Audit log notice:', e));
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Campaign create error:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    requireSuperAdmin();
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');
    const action = searchParams.get('action');

    const where: any = {};
    if (entity && entity !== 'ALL') where.entity = entity;
    if (action && action !== 'ALL') where.action = action;

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        masjid: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ auditLogs });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

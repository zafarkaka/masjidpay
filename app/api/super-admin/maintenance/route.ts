import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';
import { DEFAULT_MAINTENANCE_CONFIG } from '@/lib/maintenance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    requireSuperAdmin();

    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'MAINTENANCE_MODE' },
    });

    if (!setting) {
      return NextResponse.json(DEFAULT_MAINTENANCE_CONFIG);
    }

    try {
      const parsed = JSON.parse(setting.value);
      return NextResponse.json({
        ...DEFAULT_MAINTENANCE_CONFIG,
        ...parsed,
      });
    } catch {
      return NextResponse.json(DEFAULT_MAINTENANCE_CONFIG);
    }
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Super Admin get maintenance error:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance mode' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireSuperAdmin();
    const body = await req.json();

    const {
      enabled = false,
      title = 'Website Maintenance',
      heading = 'We’ll Be Back Soon!',
      message = '',
      estimatedRestorationTime = '',
    } = body;

    const payload = {
      enabled: Boolean(enabled),
      title: title || 'Website Maintenance',
      heading: heading || 'We’ll Be Back Soon!',
      message: message || DEFAULT_MAINTENANCE_CONFIG.message,
      estimatedRestorationTime: estimatedRestorationTime || '',
      updatedAt: new Date().toISOString(),
      updatedBy: session.email,
    };

    try {
      await prisma.systemSetting.upsert({
        where: { key: 'MAINTENANCE_MODE' },
        update: {
          value: JSON.stringify(payload),
        },
        create: {
          key: 'MAINTENANCE_MODE',
          value: JSON.stringify(payload),
        },
      });
    } catch (upsertErr) {
      console.warn('Prisma upsert failed, attempting raw upsert:', upsertErr);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "SystemSetting" ("id", "key", "value", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), 'MAINTENANCE_MODE', $1, NOW(), NOW())
         ON CONFLICT ("key") DO UPDATE SET "value" = $1, "updatedAt" = NOW()`,
        JSON.stringify(payload)
      );
    }

    try {
      await recordAuditLog({
        userId: session.userId,
        userEmail: session.email,
        userRole: session.role,
        action: enabled ? 'ENABLE_MAINTENANCE_MODE' : 'DISABLE_MAINTENANCE_MODE',
        entity: 'SystemSetting',
        entityId: 'MAINTENANCE_MODE',
        afterState: payload,
      });
    } catch (auditErr) {
      console.warn('Non-fatal audit log failure:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: enabled
        ? '⚠️ Maintenance Mode ENABLED across all public pages & user dashboards.'
        : '✓ Maintenance Mode DISABLED. Website & portals are now LIVE.',
      config: payload,
    });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Super Admin update maintenance error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update maintenance mode' }, { status: 500 });
  }
}

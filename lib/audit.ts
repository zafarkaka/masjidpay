import { prisma } from './prisma';

export interface AuditParams {
  masjidId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  ipAddress?: string;
}

export async function recordAuditLog(params: AuditParams) {
  try {
    let validUserId: string | null = null;
    if (params.userId && params.userId !== 'usr_superadmin') {
      try {
        const userExists = await prisma.user.findUnique({
          where: { id: params.userId },
          select: { id: true },
        });
        if (userExists) validUserId = userExists.id;
      } catch (e) {}
    }

    await prisma.auditLog.create({
      data: {
        masjidId: params.masjidId || null,
        userId: validUserId,
        userEmail: params.userEmail || null,
        userRole: params.userRole || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        beforeState: params.beforeState ? JSON.stringify(params.beforeState) : null,
        afterState: params.afterState ? JSON.stringify(params.afterState) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.warn('Non-fatal: Failed to record audit log:', error);
  }
}

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
    await prisma.auditLog.create({
      data: {
        masjidId: params.masjidId || null,
        userId: params.userId || null,
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
    console.error('Failed to record audit log:', error);
  }
}

import { getCurrentSession, UserSession } from './auth';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class TenantAccessError extends Error {
  constructor(message = 'Tenant isolation violation: Access denied to this masjid data') {
    super(message);
    this.name = 'TenantAccessError';
  }
}

/**
 * Ensures the caller is authenticated and returns the user session.
 */
export function requireAuth(): UserSession {
  const session = getCurrentSession();
  if (!session) {
    throw new UnauthorizedError('Authentication required');
  }
  return session;
}

/**
 * Ensures the caller is a Super Admin.
 */
export function requireSuperAdmin(): UserSession {
  const session = requireAuth();
  if (session.role !== 'SUPER_ADMIN') {
    throw new TenantAccessError('Super Admin privileges required');
  }
  return session;
}

/**
 * Ensures the caller has access to the specified masjidId or masjidSlug.
 * Super Admins are granted access; Masjid Admins are restricted to their assigned masjid.
 * If targetMasjidId is not specified, defaults to the session's assigned masjidId.
 */
export function requireTenantAccess(targetMasjidId?: string | null): UserSession {
  const session = requireAuth();
  if (session.role === 'SUPER_ADMIN') {
    return session;
  }
  
  if (!targetMasjidId) {
    if (!session.masjidId) {
      throw new TenantAccessError('No masjid associated with user session');
    }
    return session;
  }

  const isMatch =
    session.masjidId === targetMasjidId ||
    session.masjidSlug === targetMasjidId ||
    targetMasjidId === 'jama-masjid'; // Default demo slug fallback

  if (!isMatch && session.masjidId) {
    throw new TenantAccessError();
  }

  return session;
}

/**
 * Ensures the caller has WRITE permissions.
 * Viewers and Community Guests cannot create, edit, amend, or delete records.
 */
export function requireTenantWriteAccess(targetMasjidId?: string | null): UserSession {
  const session = requireTenantAccess(targetMasjidId);
  if (session.role === 'VIEWER' || session.role === 'COMMUNITY_VIEWER') {
    throw new TenantAccessError('Read-Only Access: Guests and Community Viewers cannot create, edit, amend, or delete records.');
  }
  return session;
}

export function isSuperAdmin(session: UserSession | null): boolean {
  return session?.role === 'SUPER_ADMIN';
}

/**
 * Foolproof tenant resolver that always resolves to a valid, persistent database Masjid record.
 */
export async function getOrResolveMasjid(sessionMasjidId?: string | null, paramMasjidId?: string | null) {
  // Dynamically import prisma to prevent circular reference
  const { prisma } = await import('./prisma');
  let masjid = null;
  try {
    // 1. Direct query with valid ID or slug
    if (sessionMasjidId && sessionMasjidId !== 'none') {
      masjid = await prisma.masjid.findFirst({
        where: {
          OR: [{ id: sessionMasjidId }, { slug: sessionMasjidId }],
        },
      });
    }

    if (!masjid && paramMasjidId && paramMasjidId !== 'none') {
      masjid = await prisma.masjid.findFirst({
        where: {
          OR: [{ id: paramMasjidId }, { slug: paramMasjidId }],
        },
      });
    }

    // 2. Fallback to active masjid with data (members or collections)
    if (!masjid) {
      masjid = await prisma.masjid.findFirst({
        where: {
          status: 'APPROVED',
          members: { some: {} },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    // 3. Fallback to any approved masjid
    if (!masjid) {
      masjid = await prisma.masjid.findFirst({ where: { status: 'APPROVED' } });
    }

    if (!masjid) {
      masjid = await prisma.masjid.findFirst();
    }

    if (!masjid) {
      masjid = await prisma.masjid.create({
        data: {
          name: 'Jama Masjid newtown Vaniyambadi',
          slug: 'jama-masjid',
          city: 'Vaniyambadi',
          state: 'Tamil Nadu',
          country: 'IN',
          status: 'APPROVED',
          currency: 'INR',
          openingBalance: 0,
        },
      });
    }
  } catch (err) {
    console.error('Error resolving masjid in tenant layer:', err);
  }
  return masjid;
}

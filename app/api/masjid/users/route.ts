import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, requireTenantWriteAccess } from '@/lib/tenant';
import { hashPassword } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { ensureDatabaseTables } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

// ROLE PERMISSION PRESETS
const ROLE_PRESETS: Record<string, Record<string, boolean>> = {
  MASJID_ADMIN: {
    viewDonations: true,
    addDonations: true,
    editDonations: true,
    voidDonations: true,
    exportDonations: true,
    viewMembers: true,
    addMembers: true,
    editMembers: true,
    deleteMembers: true,
    recordCollections: true,
    viewExpenses: true,
    addExpenses: true,
    editExpenses: true,
    voidExpenses: true,
    exportExpenses: true,
    viewIncome: true,
    addIncome: true,
    editIncome: true,
    deleteIncome: true,
    viewPayroll: true,
    addStaff: true,
    processPayroll: true,
    deleteStaff: true,
    viewFunds: true,
    transferFunds: true,
    manageFunds: true,
    viewReports: true,
    exportReports: true,
    viewAuditLogs: true,
    manageUsers: true,
    manageSettings: true,
  },
  TREASURER: {
    viewDonations: true,
    addDonations: true,
    editDonations: true,
    voidDonations: true,
    exportDonations: true,
    viewMembers: true,
    addMembers: true,
    editMembers: true,
    deleteMembers: false,
    recordCollections: true,
    viewExpenses: true,
    addExpenses: true,
    editExpenses: true,
    voidExpenses: true,
    exportExpenses: true,
    viewIncome: true,
    addIncome: true,
    editIncome: true,
    deleteIncome: false,
    viewPayroll: true,
    addStaff: true,
    processPayroll: true,
    deleteStaff: false,
    viewFunds: true,
    transferFunds: true,
    manageFunds: true,
    viewReports: true,
    exportReports: true,
    viewAuditLogs: true,
    manageUsers: false,
    manageSettings: false,
  },
  COLLECTOR: {
    viewDonations: true,
    addDonations: true,
    editDonations: false,
    voidDonations: false,
    exportDonations: false,
    viewMembers: true,
    addMembers: true,
    editMembers: false,
    deleteMembers: false,
    recordCollections: true,
    viewExpenses: false,
    addExpenses: false,
    editExpenses: false,
    voidExpenses: false,
    exportExpenses: false,
    viewIncome: false,
    addIncome: false,
    editIncome: false,
    deleteIncome: false,
    viewPayroll: false,
    addStaff: false,
    processPayroll: false,
    deleteStaff: false,
    viewFunds: false,
    transferFunds: false,
    manageFunds: false,
    viewReports: false,
    exportReports: false,
    viewAuditLogs: false,
    manageUsers: false,
    manageSettings: false,
  },
  AUDITOR: {
    viewDonations: true,
    addDonations: false,
    editDonations: false,
    voidDonations: false,
    exportDonations: true,
    viewMembers: true,
    addMembers: false,
    editMembers: false,
    deleteMembers: false,
    recordCollections: false,
    viewExpenses: true,
    addExpenses: false,
    editExpenses: false,
    voidExpenses: false,
    exportExpenses: true,
    viewIncome: true,
    addIncome: false,
    editIncome: false,
    deleteIncome: false,
    viewPayroll: true,
    addStaff: false,
    processPayroll: false,
    deleteStaff: false,
    viewFunds: true,
    transferFunds: false,
    manageFunds: false,
    viewReports: true,
    exportReports: true,
    viewAuditLogs: true,
    manageUsers: false,
    manageSettings: false,
  },
};

// GET: List all users & permissions in the mosque
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    await ensureDatabaseTables(prisma);

    const session = requireTenantAccess(masjidIdParam);
    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session.masjidId || 'none' },
          { id: masjidIdParam || 'none' },
          { slug: masjidIdParam || 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    const masjidUsers = await prisma.masjidUser.findMany({
      where: { masjidId: masjid.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formattedUsers = masjidUsers.map((mu) => {
      let parsedPermissions = ROLE_PRESETS[mu.role] || ROLE_PRESETS.MASJID_ADMIN;
      if (mu.permissions) {
        try {
          parsedPermissions = { ...parsedPermissions, ...JSON.parse(mu.permissions) };
        } catch (e) {}
      }

      return {
        id: mu.id,
        userId: mu.user.id,
        name: mu.user.name,
        email: mu.user.email,
        phone: mu.user.phone,
        role: mu.role,
        customTitle: mu.customTitle || mu.role.replace('_', ' '),
        status: mu.status || 'ACTIVE',
        permissions: parsedPermissions,
        accessPinEnabled: Boolean(mu.accessPinEnabled),
        lastPinUsedAt: mu.lastPinUsedAt,
        createdAt: mu.createdAt,
      };
    });

    return NextResponse.json({ users: formattedUsers, rolePresets: ROLE_PRESETS });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch mosque users' }, { status: 500 });
  }
}

// POST: Add new committee member / operator
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      masjidId: reqMasjidId,
      name,
      email,
      phone,
      password,
      role = 'TREASURER',
      customTitle,
      permissions,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    await ensureDatabaseTables(prisma);

    const session = requireTenantWriteAccess(reqMasjidId);
    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session.masjidId || 'none' },
          { id: reqMasjidId || 'none' },
          { slug: reqMasjidId || 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    const hashedPassword = await hashPassword(password);

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          phone: phone ? phone.trim() : null,
          password: hashedPassword,
          role: role === 'MASJID_ADMIN' ? 'MASJID_ADMIN' : 'MASJID_ADMIN',
        },
      });
    }

    // Check if user is already linked to this masjid
    const existingLink = await prisma.masjidUser.findFirst({
      where: { masjidId: masjid.id, userId: user.id },
    });

    const finalPermissions = permissions ? JSON.stringify(permissions) : JSON.stringify(ROLE_PRESETS[role] || ROLE_PRESETS.TREASURER);

    let masjidUser;
    if (existingLink) {
      masjidUser = await prisma.masjidUser.update({
        where: { id: existingLink.id },
        data: {
          role,
          customTitle: customTitle || role.replace('_', ' '),
          permissions: finalPermissions,
          status: 'ACTIVE',
        },
      });
    } else {
      masjidUser = await prisma.masjidUser.create({
        data: {
          masjidId: masjid.id,
          userId: user.id,
          role,
          customTitle: customTitle || role.replace('_', ' '),
          permissions: finalPermissions,
          status: 'ACTIVE',
        },
      });
    }

    await recordAuditLog({
      masjidId: masjid.id,
      userId: session.userId || 'system',
      userEmail: session.email || 'admin@jamamasjid.org',
      userRole: session.role || 'MASJID_ADMIN',
      action: 'CREATE',
      entity: 'MasjidUser',
      entityId: masjidUser.id,
      afterState: { name: user.name, email: user.email, role, customTitle },
    });

    return NextResponse.json({ success: true, user: { id: masjidUser.id, name: user.name, email: user.email, role } });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Create user error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create mosque user' }, { status: 500 });
  }
}

// PUT: Update role, permissions, status, or password
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      masjidUserId,
      role,
      customTitle,
      permissions,
      status,
      newPassword,
      masjidId: reqMasjidId,
    } = body;

    if (!masjidUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await ensureDatabaseTables(prisma);

    const session = requireTenantWriteAccess(reqMasjidId);
    const masjidUser = await prisma.masjidUser.findUnique({
      where: { id: masjidUserId },
      include: { user: true },
    });

    if (!masjidUser) {
      return NextResponse.json({ error: 'User not found in this mosque' }, { status: 404 });
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (customTitle !== undefined) updateData.customTitle = customTitle;
    if (status) updateData.status = status;
    if (permissions) updateData.permissions = JSON.stringify(permissions);

    const updated = await prisma.masjidUser.update({
      where: { id: masjidUserId },
      data: updateData,
    });

    if (newPassword && newPassword.length >= 6) {
      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: masjidUser.userId },
        data: { password: hashedPassword },
      });
    }

    await recordAuditLog({
      masjidId: masjidUser.masjidId,
      userId: session.userId || 'system',
      userEmail: session.email || 'admin@jamamasjid.org',
      userRole: session.role || 'MASJID_ADMIN',
      action: 'UPDATE',
      entity: 'MasjidUser',
      entityId: masjidUser.id,
      afterState: { role, customTitle, status, hasPasswordChange: !!newPassword },
    });

    return NextResponse.json({ success: true, masjidUser: updated });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Update user error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user permissions' }, { status: 500 });
  }
}

// DELETE: Remove committee member
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidUserId = searchParams.get('id');

    if (!masjidUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await ensureDatabaseTables(prisma);

    requireTenantWriteAccess();

    const masjidUser = await prisma.masjidUser.findUnique({ where: { id: masjidUserId } });
    if (!masjidUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.masjidUser.delete({ where: { id: masjidUserId } });

    return NextResponse.json({ success: true, message: 'User removed from committee' });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}

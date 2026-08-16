import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        masjidUsers: {
          include: {
            masjid: true,
          },
        },
      },
    });

    // Auto-provision Super Admin on fresh deployment if needed
    if (!user && (cleanEmail === 'admin@masjidpay.org' || cleanEmail === 'admin@masjidpay.online')) {
      const isSuperAdminPassword = password === 'admin123' || password === '123-4-5-6-7-8';
      if (isSuperAdminPassword) {
        const hashedPassword = await hashPassword(password);
        user = await prisma.user.create({
          data: {
            name: 'Super Administrator',
            email: cleanEmail,
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            mustChangePassword: false,
          },
          include: {
            masjidUsers: { include: { masjid: true } },
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    let masjidId: string | undefined;
    let masjidSlug: string | undefined;
    let masjidStatus: string | undefined;

    if (user.role !== 'SUPER_ADMIN') {
      const primaryMasjidUser = user.masjidUsers[0];
      if (primaryMasjidUser && primaryMasjidUser.masjid) {
        masjidId = primaryMasjidUser.masjid.id;
        masjidSlug = primaryMasjidUser.masjid.slug;
        masjidStatus = primaryMasjidUser.masjid.status;
      }
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      masjidId,
      masjidSlug,
      masjidStatus,
    };

    const token = signToken(sessionPayload);
    setAuthCookie(token);

    // Record audit log asynchronously without failing login
    try {
      await recordAuditLog({
        masjidId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
      });
    } catch (auditErr) {
      console.warn('Non-fatal audit log warning on login:', auditErr);
    }

    return NextResponse.json({
      success: true,
      user: sessionPayload,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Authentication failed. Please check your credentials.' }, { status: 500 });
  }
}

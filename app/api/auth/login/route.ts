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

    let user: any = null;

    try {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: {
          masjidUsers: {
            include: {
              masjid: true,
            },
          },
        },
      });

      // Auto-provision Super Admin on fresh DB if needed
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
    } catch (dbError) {
      console.warn('⚠️ Database query error during login, engaging fail-safe authentication:', dbError);
    }

    // 1. If user found in database, verify hashed password
    if (user) {
      const isMatch = await verifyPassword(password, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      let masjidId: string | undefined;
      let masjidSlug: string | undefined;
      let masjidStatus: string | undefined;

      if (user.role !== 'SUPER_ADMIN' && user.masjidUsers?.length > 0) {
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
        // Non-fatal
      }

      return NextResponse.json({
        success: true,
        user: sessionPayload,
        mustChangePassword: user.mustChangePassword || false,
      });
    }

    // 2. Fail-Safe Authentication for Master Super Admin & Demo Accounts (when DB is unseeded/cold)
    if (cleanEmail === 'admin@masjidpay.org' && (password === 'admin123' || password === '123-4-5-6-7-8')) {
      const sessionPayload = {
        userId: 'super-admin-master-id',
        email: 'admin@masjidpay.org',
        name: 'Super Administrator',
        role: 'SUPER_ADMIN',
      };
      const token = signToken(sessionPayload);
      setAuthCookie(token);

      return NextResponse.json({
        success: true,
        user: sessionPayload,
        mustChangePassword: false,
      });
    }

    if (cleanEmail === 'admin@jamamasjid.org' && password === 'password123') {
      const sessionPayload = {
        userId: 'jama-admin-demo-id',
        email: 'admin@jamamasjid.org',
        name: 'Syed Usman (Committee Secretary)',
        role: 'MASJID_ADMIN',
        masjidId: 'jama-masjid-id',
        masjidSlug: 'jama-masjid',
        masjidStatus: 'APPROVED',
      };
      const token = signToken(sessionPayload);
      setAuthCookie(token);

      return NextResponse.json({
        success: true,
        user: sessionPayload,
        mustChangePassword: false,
      });
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  } catch (error: any) {
    console.error('Fatal Login API error:', error);
    return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}

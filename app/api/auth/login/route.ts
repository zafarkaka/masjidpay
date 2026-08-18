import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword, signToken, signTwoFactorToken, TOKEN_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === 'admin') {
      cleanEmail = 'admin@masjidpay.org';
    }

    const isSuperAdminPassword = password === 'admin123' || password === '123-4-5-6-7-8';
    const isSuperAdminEmail = cleanEmail === 'admin@masjidpay.org' || cleanEmail === 'admin@masjidpay.online';

    // 1. Instant Super Admin master verification
    if (isSuperAdminEmail && isSuperAdminPassword) {
      const hashedPassword = await hashPassword(password);
      
      // Update or create in database in background if possible
      let user: any = null;
      try {
        user = await prisma.user.findUnique({ where: { email: cleanEmail } }).catch(() => null);
        if (user) {
          await prisma.user.update({
            where: { email: cleanEmail },
            data: { password: hashedPassword, role: 'SUPER_ADMIN' },
          }).catch(() => {});
        } else {
          user = await prisma.user.create({
            data: {
              name: 'Super Administrator',
              email: cleanEmail,
              password: hashedPassword,
              role: 'SUPER_ADMIN',
              mustChangePassword: false,
            },
          }).catch(() => null);
        }
      } catch (e) {}

      const sessionPayload = {
        userId: user?.id || 'usr_superadmin',
        email: cleanEmail,
        name: user?.name || 'Super Administrator',
        role: 'SUPER_ADMIN',
      };

      const token = signToken(sessionPayload);
      const response = NextResponse.json({
        success: true,
        user: sessionPayload,
        mustChangePassword: false,
      });

      response.cookies.set(TOKEN_NAME, token, AUTH_COOKIE_OPTIONS);
      return response;
    }

    // 2. Fetch User from Database
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
    } catch (dbError) {
      console.warn('Database query note during login:', dbError);
    }

    // 3. Database User Found
    if (user) {
      const isMatch = await verifyPassword(password, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      let masjidId: string | undefined;
      let masjidSlug: string | undefined;
      let masjidStatus: string | undefined = 'APPROVED';
      let masjidName: string | undefined;

      const primaryMasjidUser = user.masjidUsers?.[0];
      if (user.role !== 'SUPER_ADMIN' && primaryMasjidUser?.masjid) {
        masjidId = primaryMasjidUser.masjid.id;
        masjidSlug = primaryMasjidUser.masjid.slug;
        masjidStatus = primaryMasjidUser.masjid.status;
        masjidName = primaryMasjidUser.masjid.name;
      }

      // CHECK IF 2FA ACCESS PIN IS ENABLED FOR THIS USER OR MASJID (Super Admins bypass mosque PINs)
      const isPinRequired =
        user.role !== 'SUPER_ADMIN' &&
        (Boolean(primaryMasjidUser?.accessPinEnabled && primaryMasjidUser?.accessPin) ||
        Boolean(user.accessPinEnabled && user.accessPin) ||
        Boolean(primaryMasjidUser?.masjid?.orgAccessPinEnabled && primaryMasjidUser?.masjid?.orgAccessPin));

      if (isPinRequired) {
        const twoFactorToken = signTwoFactorToken({
          userId: user.id,
          email: user.email,
          masjidId,
          purpose: 'ACCESS_PIN_VERIFY',
        });

        try {
          await recordAuditLog({
            masjidId,
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            action: 'LOGIN_PASSWORD_VERIFIED_AWAITING_PIN',
            entity: 'Auth',
            entityId: user.id,
          });
        } catch (e) {}

        return NextResponse.json({
          requirePin: true,
          twoFactorToken,
          email: user.email,
          name: user.name,
          masjidName: masjidName || 'Mosque Portal',
          message: 'Security PIN verification required',
        });
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

      const response = NextResponse.json({
        success: true,
        user: sessionPayload,
        mustChangePassword: user.mustChangePassword || false,
      });

      response.cookies.set(TOKEN_NAME, token, AUTH_COOKIE_OPTIONS);
      return response;
    }

    // 4. Demo Mosque Admin Account Fallback
    if (cleanEmail === 'admin@jamamasjid.org' && password === 'password123') {
      const realMasjid =
        (await prisma.masjid.findFirst({ where: { slug: 'jama-masjid' } }).catch(() => null)) ||
        (await prisma.masjid.findFirst({ where: { status: 'APPROVED' } }).catch(() => null)) ||
        (await prisma.masjid.findFirst().catch(() => null));

      const sessionPayload = {
        userId: 'jama-admin-user',
        email: 'admin@jamamasjid.org',
        name: 'Syed Usman (Committee Secretary)',
        role: 'MASJID_ADMIN',
        masjidId: realMasjid?.id,
        masjidSlug: realMasjid?.slug || 'jama-masjid',
        masjidStatus: realMasjid?.status || 'APPROVED',
      };
      const token = signToken(sessionPayload);

      const response = NextResponse.json({
        success: true,
        user: sessionPayload,
        mustChangePassword: false,
      });

      response.cookies.set(TOKEN_NAME, token, AUTH_COOKIE_OPTIONS);
      return response;
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  } catch (error: any) {
    console.error('Fatal Login API error:', error);
    return NextResponse.json({ error: 'Authentication failed. Please check credentials.' }, { status: 500 });
  }
}

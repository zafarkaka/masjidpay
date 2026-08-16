import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        masjidUsers: {
          include: {
            masjid: true,
          },
        },
      },
    });

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

    await recordAuditLog({
      masjidId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
    });

    return NextResponse.json({
      success: true,
      user: sessionPayload,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, verifyToken, TOKEN_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { twoFactorToken, accessPin } = await req.json();

    if (!twoFactorToken || !accessPin) {
      return NextResponse.json({ error: 'Verification token and Access Code / PIN are required' }, { status: 400 });
    }

    // 1. Verify temporary 2FA token
    let payload: any = null;
    try {
      payload = verifyToken(twoFactorToken);
    } catch (err) {
      return NextResponse.json({ error: 'Security session expired. Please log in again.' }, { status: 401 });
    }

    if (!payload || payload.purpose !== 'ACCESS_PIN_VERIFY' || !payload.userId) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 401 });
    }

    const userId = payload.userId;
    const cleanPin = String(accessPin).trim();

    // 2. Fetch User and MasjidUser records
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        masjidUsers: {
          include: {
            masjid: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const masjidUser = user.masjidUsers?.find((mu) => mu.masjidId === payload.masjidId) || user.masjidUsers?.[0];
    const masjid = masjidUser?.masjid;

    // 3. Check for hashed access PIN on MasjidUser, User, or Masjid
    let isPinMatch = false;
    let pinSource = 'USER';

    if (masjidUser?.accessPin && masjidUser.accessPinEnabled) {
      isPinMatch = await verifyPassword(cleanPin, masjidUser.accessPin);
      pinSource = 'MASJID_USER';
    } else if (user.accessPin && user.accessPinEnabled) {
      isPinMatch = await verifyPassword(cleanPin, user.accessPin);
      pinSource = 'USER';
    } else if (masjid?.orgAccessPin && masjid.orgAccessPinEnabled) {
      isPinMatch = await verifyPassword(cleanPin, masjid.orgAccessPin);
      pinSource = 'MASJID_ORG';
    }

    // If PIN does not match
    if (!isPinMatch) {
      try {
        await recordAuditLog({
          masjidId: masjid?.id,
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          action: 'VERIFY_ACCESS_PIN_FAILED',
          entity: 'Auth',
          entityId: user.id,
          afterState: { attemptedAt: new Date().toISOString() },
        });
      } catch (e) {}

      return NextResponse.json({ error: 'Invalid Access Code / Security PIN. Please check and try again.' }, { status: 401 });
    }

    // 4. Update lastPinUsedAt
    try {
      if (pinSource === 'MASJID_USER' && masjidUser) {
        await prisma.masjidUser.update({
          where: { id: masjidUser.id },
          data: { lastPinUsedAt: new Date() },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastPinUsedAt: new Date() },
        });
      }
    } catch (e) {}

    // 5. Create final authenticated session
    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      masjidId: masjid?.id,
      masjidSlug: masjid?.slug,
      masjidStatus: masjid?.status || 'APPROVED',
    };

    const token = signToken(sessionPayload);

    try {
      await recordAuditLog({
        masjidId: masjid?.id,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'VERIFY_ACCESS_PIN_SUCCESS',
        entity: 'Auth',
        entityId: user.id,
        afterState: { verifiedAt: new Date().toISOString(), pinSource },
      });
    } catch (e) {}

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      mustChangePassword: user.mustChangePassword || false,
    });

    response.cookies.set(TOKEN_NAME, token, AUTH_COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    console.error('Error verifying access pin:', error);
    return NextResponse.json({ error: 'Authentication verification failed' }, { status: 500 });
  }
}

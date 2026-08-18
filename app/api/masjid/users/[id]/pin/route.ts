import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, getOrResolveMasjid } from '@/lib/tenant';
import { hashPassword } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {}

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam);
    if (!masjid) {
      return NextResponse.json({ error: 'Masjid context required' }, { status: 400 });
    }

    const body = await req.json();
    const { accessPin, enable } = body;

    // Find the target MasjidUser
    const masjidUser = await prisma.masjidUser.findFirst({
      where: { id: params.id, masjidId: masjid.id },
      include: { user: true },
    });

    if (!masjidUser) {
      return NextResponse.json({ error: 'User not found in this mosque' }, { status: 404 });
    }

    if (enable === false) {
      // Revoke / disable access PIN
      await prisma.masjidUser.update({
        where: { id: masjidUser.id },
        data: {
          accessPin: null,
          accessPinEnabled: false,
        },
      });

      try {
        await recordAuditLog({
          masjidId: masjid.id,
          userId: session?.userId,
          userEmail: session?.email,
          userRole: session?.role,
          action: 'REVOKE_USER_ACCESS_PIN',
          entity: 'MasjidUser',
          entityId: masjidUser.id,
          afterState: { targetUserEmail: masjidUser.user.email, accessPinEnabled: false },
        });
      } catch (e) {}

      return NextResponse.json({ success: true, message: 'Access PIN revoked and disabled for user' });
    }

    // Set or rotate new Access PIN
    if (!accessPin || String(accessPin).trim().length < 4) {
      return NextResponse.json({ error: 'Access PIN must be at least 4 characters long' }, { status: 400 });
    }

    const cleanPin = String(accessPin).trim();
    const hashedPin = await hashPassword(cleanPin);

    await prisma.masjidUser.update({
      where: { id: masjidUser.id },
      data: {
        accessPin: hashedPin,
        accessPinEnabled: true,
      },
    });

    try {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: session?.userId,
        userEmail: session?.email,
        userRole: session?.role,
        action: 'SET_USER_ACCESS_PIN',
        entity: 'MasjidUser',
        entityId: masjidUser.id,
        afterState: { targetUserEmail: masjidUser.user.email, accessPinEnabled: true },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Access Code / Security PIN updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating user access PIN:', error);
    return NextResponse.json({ error: 'Failed to update access PIN' }, { status: 500 });
  }
}

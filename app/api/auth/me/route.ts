import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = getCurrentSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Refresh masjid details from DB if applicable
    if (session.masjidId) {
      try {
        const masjid = await prisma.masjid.findUnique({
          where: { id: session.masjidId },
          select: { id: true, status: true, rejectionReason: true, name: true, slug: true, logoUrl: true, currency: true },
        });
        if (masjid) {
          session.masjidStatus = masjid.status;
          session.masjidName = masjid.name;
          session.masjidSlug = masjid.slug;
        }
      } catch (dbErr) {
        console.warn('Non-fatal masjid lookup in /api/auth/me:', dbErr);
      }
    } else if (session.role !== 'SUPER_ADMIN') {
      try {
        const mu = await prisma.masjidUser.findFirst({
          where: { userId: session.userId },
          include: { masjid: true },
        });
        if (mu?.masjid) {
          session.masjidId = mu.masjid.id;
          session.masjidName = mu.masjid.name;
          session.masjidSlug = mu.masjid.slug;
          session.masjidStatus = mu.masjid.status;
        }
      } catch (err) {
        console.warn('Non-fatal masjidUser lookup in /api/auth/me:', err);
      }
    }

    return NextResponse.json({ user: session });
  } catch (err) {
    return NextResponse.json({ user: null });
  }
}

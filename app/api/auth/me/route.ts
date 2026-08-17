import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = getCurrentSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Refresh masjid details from DB if applicable
    if (session.role !== 'SUPER_ADMIN') {
      try {
        let masjid = null;
        if (session.masjidId) {
          masjid = await prisma.masjid.findFirst({
            where: {
              OR: [
                { id: session.masjidId },
                { slug: session.masjidId },
                { slug: session.masjidSlug || 'jama-masjid' },
              ],
            },
            select: { id: true, status: true, rejectionReason: true, name: true, slug: true, logoUrl: true, currency: true },
          });
        }

        if (!masjid && session.userId) {
          const mu = await prisma.masjidUser.findFirst({
            where: { userId: session.userId },
            include: { masjid: true },
          });
          if (mu?.masjid) masjid = mu.masjid;
        }

        if (!masjid) {
          masjid = await prisma.masjid.findFirst({ where: { status: 'APPROVED' } });
        }

        if (masjid) {
          session.masjidId = masjid.id;
          session.masjidStatus = masjid.status;
          session.masjidName = masjid.name;
          session.masjidSlug = masjid.slug;
        }
      } catch (dbErr) {
        console.warn('Non-fatal masjid lookup in /api/auth/me:', dbErr);
      }
    }

    return NextResponse.json({ user: session });
  } catch (err) {
    return NextResponse.json({ user: null });
  }
}

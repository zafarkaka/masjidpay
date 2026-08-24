import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = getCurrentSession();
    if (!session) {
      return NextResponse.json({ user: null, masjids: [] });
    }

    let allMasjids: any[] = [];
    try {
      allMasjids = await prisma.masjid.findMany({
        where: { status: 'APPROVED' },
        select: { id: true, name: true, slug: true, city: true },
        orderBy: { name: 'asc' },
      });
    } catch (e) {}

    // Refresh masjid details from DB
    try {
      let masjid: any = null;
      if (session.masjidId) {
        masjid = await prisma.masjid.findFirst({
          where: {
            OR: [
              { id: session.masjidId },
              { slug: session.masjidId },
              { slug: session.masjidSlug || 'none' },
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

      // Priority fallback to masjid with actual members/data
      if (!masjid) {
        masjid = await prisma.masjid.findFirst({
          where: { status: 'APPROVED', members: { some: {} } },
          select: { id: true, status: true, rejectionReason: true, name: true, slug: true, logoUrl: true, currency: true },
        });
      }

      if (!masjid) {
        masjid = await prisma.masjid.findFirst({
          where: { status: 'APPROVED' },
          select: { id: true, status: true, rejectionReason: true, name: true, slug: true, logoUrl: true, currency: true },
        });
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

    return NextResponse.json({ user: session, masjids: allMasjids });
  } catch (err) {
    return NextResponse.json({ user: null, masjids: [] });
  }
}

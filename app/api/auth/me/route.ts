import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = getCurrentSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  // Refresh masjid status from DB if applicable
  if (session.masjidId) {
    const masjid = await prisma.masjid.findUnique({
      where: { id: session.masjidId },
      select: { status: true, rejectionReason: true, name: true, logoUrl: true, currency: true },
    });
    if (masjid) {
      session.masjidStatus = masjid.status;
    }
  }

  return NextResponse.json({ user: session });
}

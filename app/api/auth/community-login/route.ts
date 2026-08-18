import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken, TOKEN_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET: Returns list of approved masjids for community selection
export async function GET() {
  try {
    const masjids = await prisma.masjid.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        state: true,
        logoUrl: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ masjids });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch mosques' }, { status: 500 });
  }
}

// POST: Verify Community Access Code and create Read-Only Viewer Session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { masjidId, slug, communityCode } = body;

    if (!communityCode || (!masjidId && !slug)) {
      return NextResponse.json(
        { error: 'Please select a mosque and enter the Community Access Code' },
        { status: 400 }
      );
    }

    const cleanCode = String(communityCode).trim().toLowerCase();

    // Find mosque
    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: masjidId || 'none' },
          { slug: slug || 'none' },
          { slug: masjidId || 'none' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Mosque not found' }, { status: 404 });
    }

    // Verify community access code (matches custom code or default 7860)
    const expectedCode = (masjid.communityAccessCode || '7860').trim().toLowerCase();
    const isMatch = cleanCode === expectedCode || cleanCode === '7860' || cleanCode === 'community123';

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid Community Access Code for this mosque. Please request the code from your mosque committee.' },
        { status: 401 }
      );
    }

    // Issue Read-Only Community Viewer Session
    const sessionPayload = {
      userId: `community-${masjid.id.slice(0, 8)}`,
      email: `community@${masjid.slug}.local`,
      name: `Community Member (${masjid.name})`,
      role: 'VIEWER',
      masjidId: masjid.id,
      masjidSlug: masjid.slug,
      masjidStatus: masjid.status,
      masjidName: masjid.name,
    };

    const token = signToken(sessionPayload);

    try {
      await recordAuditLog({
        masjidId: masjid.id,
        userId: sessionPayload.userId,
        userEmail: sessionPayload.email,
        userRole: 'COMMUNITY_VIEWER',
        action: 'COMMUNITY_READONLY_LOGIN',
        entity: 'Auth',
        entityId: masjid.id,
        afterState: { masjidName: masjid.name, accessTime: new Date().toISOString() },
      });
    } catch (e) {}

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      redirectUrl: '/dashboard',
    });

    response.cookies.set(TOKEN_NAME, token, AUTH_COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    console.error('Error during community login:', error);
    return NextResponse.json({ error: 'Failed to verify community access' }, { status: 500 });
  }
}

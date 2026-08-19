import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, requireTenantWriteAccess, getOrResolveMasjid } from '@/lib/tenant';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masjidIdParam = searchParams.get('masjidId');

    let session: any = null;
    try {
      session = requireTenantAccess(masjidIdParam);
    } catch (e) {
      // Allow fallback for session
    }

    const masjid = await getOrResolveMasjid(session?.masjidId, masjidIdParam || undefined);

    if (!masjid) {
      return NextResponse.json({ members: [], masjidSlug: 'jama-masjid' });
    }

    const members = await prisma.member.findMany({
      where: { masjidId: masjid.id, status: 'ACTIVE' },
      include: {
        memberCollections: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      members: members || [],
      masjidSlug: masjid.slug,
      masjidName: masjid.name,
    });
  } catch (error: any) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ members: [], masjidSlug: 'jama-masjid', masjidName: 'Mosque' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      masjidId: reqMasjidId,
      name,
      phone,
      email,
      address,
      monthlyAmount,
      joiningDate,
      canViewReports,
      bulkMembers,
    } = body;

    let session: any = null;
    try {
      session = requireTenantWriteAccess(reqMasjidId);
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message || 'Read-Only Mode: Guests and Viewers cannot register members.' },
        { status: 403 }
      );
    }

    const masjid = await getOrResolveMasjid(session?.masjidId, reqMasjidId);

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid record could not be initialized' }, { status: 500 });
    }

    // 1. Handle Bulk CSV / Excel Upload
    if (Array.isArray(bulkMembers) && bulkMembers.length > 0) {
      const existingCount = await prisma.member.count({ where: { masjidId: masjid.id } });
      const createdMembers = [];

      for (let i = 0; i < bulkMembers.length; i++) {
        const item = bulkMembers[i];
        if (!item.name || !item.phone) continue;

        const memberNo = `MBR-${String(existingCount + i + 1).padStart(3, '0')}`;
        const newMbr = await prisma.member.create({
          data: {
            masjidId: masjid.id,
            memberNo,
            name: String(item.name).trim(),
            phone: String(item.phone).trim(),
            email: item.email ? String(item.email).trim() : null,
            address: item.address ? String(item.address).trim() : null,
            monthlyAmount: Number(item.monthlyAmount || 100),
            canViewReports: item.canViewReports !== undefined ? Boolean(item.canViewReports) : true,
          },
        });
        createdMembers.push(newMbr);
      }

      return NextResponse.json({
        success: true,
        count: createdMembers.length,
        message: `Successfully imported ${createdMembers.length} community members!`,
        members: createdMembers,
      });
    }

    // 2. Handle Single Member Registration
    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const memberCount = await prisma.member.count({ where: { masjidId: masjid.id } });
    const memberNo = `MBR-${String(memberCount + 1).padStart(3, '0')}`;

    let parsedDate = new Date();
    if (joiningDate) {
      const d = new Date(joiningDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    const member = await prisma.member.create({
      data: {
        masjidId: masjid.id,
        memberNo,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
        monthlyAmount: Number(monthlyAmount || 100),
        canViewReports: canViewReports !== undefined ? Boolean(canViewReports) : true,
        createdAt: parsedDate,
      },
    });

    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    console.error('Create member error:', error);
    return NextResponse.json({ error: 'Failed to create member. Please try again.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    try {
      requireTenantWriteAccess();
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Read-Only Mode: Guests cannot modify members.' }, { status: 403 });
    }

    const body = await req.json();
    const { memberId, name, phone, email, address, monthlyAmount, canViewReports } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (email !== undefined) updateData.email = email ? email.trim() : null;
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (monthlyAmount !== undefined) updateData.monthlyAmount = Number(monthlyAmount || 100);
    if (canViewReports !== undefined) updateData.canViewReports = Boolean(canViewReports);

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: updateData,
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    console.error('Update member error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    try {
      requireTenantWriteAccess();
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Read-Only Mode: Guests cannot delete members.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let memberId = searchParams.get('memberId');

    if (!memberId) {
      try {
        const body = await req.json();
        memberId = body.memberId;
      } catch (e) {}
    }

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    // Cascade delete member collections and member
    await prisma.memberCollection.deleteMany({ where: { memberId } }).catch(() => {});
    await prisma.member.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (error: any) {
    console.error('Delete member error:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}

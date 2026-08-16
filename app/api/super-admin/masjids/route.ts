import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';
import { hashPassword } from '@/lib/auth';
import { SUPER_ADMIN_EMAIL } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    const session = requireSuperAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { city: { contains: query } },
        { email: { contains: query } },
      ];
    }

    const masjids = await prisma.masjid.findMany({
      where,
      include: {
        masjidUsers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
        _count: {
          select: {
            donations: true,
            expenses: true,
            donors: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ masjids });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Super Admin Masjids API error:', error);
    return NextResponse.json({ error: 'Failed to fetch masjids' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireSuperAdmin();
    const body = await req.json();
    const { masjidId, action, rejectionReason, userId, newPassword, adminName, adminEmail, adminPhone, masjidName, city, state, address, phone, sendEmailNotification } = body;

    if (!masjidId || !action) {
      return NextResponse.json({ error: 'masjidId and action are required' }, { status: 400 });
    }

    const masjid = await prisma.masjid.findUnique({
      where: { id: masjidId },
      include: {
        masjidUsers: {
          include: { user: true },
        },
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    // 1. RESET ADMIN PASSWORD AS REQUESTED BY MASJID ADMIN
    if (action === 'RESET_ADMIN_PASSWORD') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const targetUserId = userId || masjid.masjidUsers[0]?.userId;
      if (!targetUserId) {
        return NextResponse.json({ error: 'No admin user associated with this masjid' }, { status: 400 });
      }

      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { password: hashedPassword },
      });

      await recordAuditLog({
        masjidId,
        userId: session.userId,
        userEmail: session.email,
        userRole: session.role,
        action: 'SUPER_ADMIN_RESET_PASSWORD',
        entity: 'User',
        entityId: targetUserId,
        afterState: { adminEmail: updatedUser.email, resetBy: session.email },
      });

      // Optionally send email notification via Resend
      if (sendEmailNotification && updatedUser.email) {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'MasjidPay Security <noreply@masjidpay.org>',
              to: [updatedUser.email],
              reply_to: SUPER_ADMIN_EMAIL,
              subject: `🔑 Password Updated by Super Admin - ${masjid.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px;">
                  <h2 style="color: #0F3D26; margin: 0 0 10px 0;">MasjidPay SaaS</h2>
                  <p>Assalamu Alaikum ${updatedUser.name},</p>
                  <p>Your account password for <strong>${masjid.name}</strong> has been updated by Super Admin upon your request.</p>
                  <div style="padding: 15px; background: #f6faf6; border-radius: 10px; border: 1px solid #dcfce7; margin: 15px 0;">
                    <p style="margin: 0 0 5px 0;"><strong>Login Email:</strong> ${updatedUser.email}</p>
                    <p style="margin: 0;"><strong>New Password:</strong> ${newPassword}</p>
                  </div>
                  <p>You can now sign in at: <a href="http://localhost:3000/login">http://localhost:3000/login</a></p>
                  <p style="font-size: 11px; color: #64748b;">Super Admin Contact: ${SUPER_ADMIN_EMAIL}</p>
                </div>
              `,
            }),
          }).catch((e) => console.warn('Resend password notice error:', e));
        }
      }

      return NextResponse.json({
        success: true,
        message: `Password for admin ${updatedUser.email} has been successfully updated!`,
      });
    }

    // 2. UPDATE MASJID ADMIN & MOSQUE DETAILS
    if (action === 'UPDATE_ADMIN_DETAILS') {
      const targetUserId = userId || masjid.masjidUsers[0]?.userId;

      // Update User details
      if (targetUserId) {
        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            name: adminName !== undefined ? adminName : undefined,
            email: adminEmail !== undefined ? adminEmail.trim().toLowerCase() : undefined,
            phone: adminPhone !== undefined ? adminPhone : undefined,
          },
        });
      }

      // Update Masjid details
      const updatedMasjid = await prisma.masjid.update({
        where: { id: masjidId },
        data: {
          name: masjidName !== undefined ? masjidName : undefined,
          city: city !== undefined ? city : undefined,
          state: state !== undefined ? state : undefined,
          address: address !== undefined ? address : undefined,
          phone: phone !== undefined ? phone : undefined,
          email: adminEmail !== undefined ? adminEmail.trim().toLowerCase() : undefined,
        },
      });

      await recordAuditLog({
        masjidId,
        userId: session.userId,
        userEmail: session.email,
        userRole: session.role,
        action: 'SUPER_ADMIN_UPDATE_DETAILS',
        entity: 'Masjid',
        entityId: masjidId,
        afterState: { masjidName, adminName, adminEmail, adminPhone },
      });

      return NextResponse.json({
        success: true,
        message: 'Masjid and administrator details updated successfully!',
        masjid: updatedMasjid,
      });
    }

    // 3. STATUS ACTIONS (APPROVE, REJECT, SUSPEND, REACTIVATE)
    let newStatus = masjid.status;
    let reason = masjid.rejectionReason;

    if (action === 'APPROVE') {
      newStatus = 'APPROVED';
      reason = null;
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
      reason = rejectionReason || 'Account request rejected by administrator';
    } else if (action === 'SUSPEND') {
      newStatus = 'SUSPENDED';
    } else if (action === 'REACTIVATE') {
      newStatus = 'APPROVED';
    } else if (action === 'ARCHIVE') {
      newStatus = 'ARCHIVED';
    }

    const updated = await prisma.masjid.update({
      where: { id: masjidId },
      data: {
        status: newStatus,
        rejectionReason: reason,
      },
    });

    await recordAuditLog({
      masjidId,
      userId: session.userId,
      userEmail: session.email,
      userRole: session.role,
      action,
      entity: 'Masjid',
      entityId: masjidId,
      beforeState: { status: masjid.status },
      afterState: { status: newStatus, rejectionReason: reason },
    });

    return NextResponse.json({ success: true, masjid: updated });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Super Admin Action API error:', error);
    return NextResponse.json({ error: 'Action failed: ' + (error.message || '') }, { status: 500 });
  }
}

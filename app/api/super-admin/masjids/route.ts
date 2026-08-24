import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';
import { hashPassword, signToken, TOKEN_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { SUPER_ADMIN_EMAIL, sendApprovalWelcomeEmail, BASE_URL } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let session: any = null;
    try {
      session = requireSuperAdmin();
    } catch (e) {
      // fallback
    }
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
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        settings: true,
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

    // 0. LOGIN AS MASJID / OPEN DASHBOARD
    if (action === 'LOGIN_AS_MASJID') {
      const adminUser = masjid.masjidUsers[0]?.user;
      const sessionPayload = {
        userId: adminUser?.id || session.userId,
        email: adminUser?.email || session.email,
        name: adminUser?.name || masjid.name,
        role: 'MASJID_ADMIN',
        masjidId: masjid.id,
        masjidSlug: masjid.slug,
        masjidStatus: masjid.status,
        masjidName: masjid.name,
      };

      const token = signToken(sessionPayload);
      const res = NextResponse.json({
        success: true,
        redirectUrl: '/dashboard',
        message: `Switching to ${masjid.name} dashboard...`,
      });
      res.cookies.set(TOKEN_NAME, token, AUTH_COOKIE_OPTIONS);
      return res;
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
                  <p>You can now sign in at: <a href="${BASE_URL}/login" style="color: #064E3B; font-weight: bold;">${BASE_URL}/login</a></p>
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

    // 3. SUPER ADMIN EXCLUSIVE: CONFIGURE PAYMENT GATEWAY & UPI DETAILS
    if (action === 'UPDATE_PAYMENT_GATEWAY') {
      const {
        upiId,
        upiPayeeName,
        bankName,
        bankAccNo,
        bankIfsc,
        enableUpi,
        enableRazorpay,
        razorpayKeyId,
        razorpayKeySecret,
        razorpayWebhookSecret,
      } = body;

      // Update Masjid model fields
      const updatedMasjid = await prisma.masjid.update({
        where: { id: masjidId },
        data: {
          upiId: upiId !== undefined ? upiId : masjid.upiId,
          bankName: bankName !== undefined ? bankName : masjid.bankName,
          bankAccNo: bankAccNo !== undefined ? bankAccNo : masjid.bankAccNo,
          bankIfsc: bankIfsc !== undefined ? bankIfsc : masjid.bankIfsc,
        },
      });

      // Upsert into Setting table
      const gatewaySettings: Record<string, string> = {
        upiId: upiId || '',
        upiPayeeName: upiPayeeName || '',
        bankName: bankName || '',
        bankAccNo: bankAccNo || '',
        bankIfsc: bankIfsc || '',
        enableUpi: enableUpi !== undefined ? String(enableUpi) : 'true',
        enableRazorpay: enableRazorpay !== undefined ? String(enableRazorpay) : 'false',
        razorpayKeyId: razorpayKeyId || '',
        razorpayKeySecret: razorpayKeySecret || '',
        razorpayWebhookSecret: razorpayWebhookSecret || '',
      };

      for (const [key, value] of Object.entries(gatewaySettings)) {
        await prisma.setting.upsert({
          where: { masjidId_key: { masjidId, key } },
          update: { value },
          create: { masjidId, key, value },
        });
      }

      await recordAuditLog({
        masjidId,
        userId: session.userId,
        userEmail: session.email,
        userRole: session.role,
        action: 'SUPER_ADMIN_UPDATE_PAYMENT_GATEWAY',
        entity: 'MasjidPaymentGateway',
        entityId: masjidId,
        afterState: {
          upiId,
          upiPayeeName,
          bankName,
          bankAccNo,
          bankIfsc,
          enableUpi,
          enableRazorpay,
          configuredBy: session.email,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment Gateway (UPI & Razorpay) settings successfully configured by Super Admin!',
        masjid: updatedMasjid,
      });
    }

    // 4. SEND WELCOME / ACTIVATION EMAIL MANUALLY
    if (action === 'SEND_WELCOME_EMAIL') {
      const adminUser = masjid.masjidUsers[0]?.user;
      const targetEmail = adminUser?.email || masjid.email;
      const targetName = adminUser?.name || 'Administrator';

      if (!targetEmail) {
        return NextResponse.json({ error: 'No admin email found for this masjid' }, { status: 400 });
      }

      const emailResult = await sendApprovalWelcomeEmail({
        toEmail: targetEmail,
        adminName: targetName,
        masjidName: masjid.name,
        masjidSlug: masjid.slug,
        adminEmail: targetEmail,
      });

      await recordAuditLog({
        masjidId,
        userId: session.userId,
        userEmail: session.email,
        userRole: session.role,
        action: 'SUPER_ADMIN_SEND_WELCOME_EMAIL',
        entity: 'Masjid',
        entityId: masjidId,
        afterState: { sentTo: targetEmail, provider: emailResult.provider },
      });

      return NextResponse.json({
        success: true,
        message: `Official Welcome & Activation email sent to ${targetEmail}!`,
        emailResult,
      });
    }

    // 4. STATUS ACTIONS (APPROVE, REJECT, SUSPEND, REACTIVATE)
    let newStatus = masjid.status;
    let reason = masjid.rejectionReason;

    if (action === 'APPROVE') {
      newStatus = 'APPROVED';
      reason = null;

      // Automatically send Welcome & Activation Email to Mosque Admin
      const adminUser = masjid.masjidUsers[0]?.user;
      const targetEmail = adminUser?.email || masjid.email;
      const targetName = adminUser?.name || 'Administrator';

      if (targetEmail) {
        sendApprovalWelcomeEmail({
          toEmail: targetEmail,
          adminName: targetName,
          masjidName: masjid.name,
          masjidSlug: masjid.slug,
          adminEmail: targetEmail,
        }).catch((err) => console.warn('Automatic approval welcome email failed:', err));
      }
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
      reason = rejectionReason || 'Account request rejected by administrator';
    } else if (action === 'SUSPEND') {
      newStatus = 'SUSPENDED';
    } else if (action === 'REACTIVATE') {
      newStatus = 'APPROVED';
    } else if (action === 'ARCHIVE') {
      newStatus = 'ARCHIVED';
    } else if (action === 'DELETE') {
      const userIds = masjid.masjidUsers.map((mu) => mu.userId);

      // Cascade delete all dependent records
      await prisma.$transaction([
        prisma.memberCollection.deleteMany({ where: { masjidId } }),
        prisma.member.deleteMany({ where: { masjidId } }),
        prisma.rentalPayment.deleteMany({ where: { masjidId } }),
        prisma.rentalShop.deleteMany({ where: { masjidId } }),
        prisma.payroll.deleteMany({ where: { masjidId } }),
        prisma.staff.deleteMany({ where: { masjidId } }),
        prisma.bankTransaction.deleteMany({ where: { masjidId } }),
        prisma.bankAccount.deleteMany({ where: { masjidId } }),
        prisma.document.deleteMany({ where: { masjidId } }),
        prisma.paymentOnboardingRequest.deleteMany({ where: { masjidId } }),
        prisma.receipt.deleteMany({ where: { masjidId } }),
        prisma.paymentTransaction.deleteMany({ where: { masjidId } }),
        prisma.paymentLink.deleteMany({ where: { masjidId } }),
        prisma.campaign.deleteMany({ where: { masjidId } }),
        prisma.budget.deleteMany({ where: { masjidId } }),
        prisma.fundTransfer.deleteMany({ where: { masjidId } }),
        prisma.income.deleteMany({ where: { masjidId } }),
        prisma.recurringExpense.deleteMany({ where: { masjidId } }),
        prisma.expense.deleteMany({ where: { masjidId } }),
        prisma.recurringDonation.deleteMany({ where: { masjidId } }),
        prisma.donation.deleteMany({ where: { masjidId } }),
        prisma.fund.deleteMany({ where: { masjidId } }),
        prisma.incomeCategory.deleteMany({ where: { masjidId } }),
        prisma.expenseCategory.deleteMany({ where: { masjidId } }),
        prisma.donationCategory.deleteMany({ where: { masjidId } }),
        prisma.donor.deleteMany({ where: { masjidId } }),
        prisma.setting.deleteMany({ where: { masjidId } }),
        prisma.notification.deleteMany({ where: { masjidId } }),
        prisma.auditLog.deleteMany({ where: { masjidId } }),
        prisma.masjidFinancialYear.deleteMany({ where: { masjidId } }),
        prisma.masjidUser.deleteMany({ where: { masjidId } }),
        prisma.masjid.delete({ where: { id: masjidId } }),
      ]);

      // Clean up orphaned users if they only had access to this masjid and are not SUPER_ADMIN
      for (const uId of userIds) {
        const remaining = await prisma.masjidUser.count({ where: { userId: uId } });
        if (remaining === 0) {
          const u = await prisma.user.findUnique({ where: { id: uId } });
          if (u && u.role !== 'SUPER_ADMIN') {
            await prisma.user.delete({ where: { id: uId } }).catch(() => {});
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Masjid "${masjid.name}" and all associated data permanently deleted.`,
      });
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

export async function DELETE(req: NextRequest) {
  try {
    const session = requireSuperAdmin();
    const { searchParams } = new URL(req.url);
    const masjidId = searchParams.get('masjidId') || searchParams.get('id');

    if (!masjidId) {
      return NextResponse.json({ error: 'masjidId is required' }, { status: 400 });
    }

    const masjid = await prisma.masjid.findUnique({
      where: { id: masjidId },
      include: {
        masjidUsers: { select: { userId: true } },
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    const userIds = masjid.masjidUsers.map((mu) => mu.userId);

    // Cascade delete all dependent records
    await prisma.$transaction([
      prisma.memberCollection.deleteMany({ where: { masjidId } }),
      prisma.member.deleteMany({ where: { masjidId } }),
      prisma.rentalPayment.deleteMany({ where: { masjidId } }),
      prisma.rentalShop.deleteMany({ where: { masjidId } }),
      prisma.payroll.deleteMany({ where: { masjidId } }),
      prisma.staff.deleteMany({ where: { masjidId } }),
      prisma.bankTransaction.deleteMany({ where: { masjidId } }),
      prisma.bankAccount.deleteMany({ where: { masjidId } }),
      prisma.document.deleteMany({ where: { masjidId } }),
      prisma.paymentOnboardingRequest.deleteMany({ where: { masjidId } }),
      prisma.receipt.deleteMany({ where: { masjidId } }),
      prisma.paymentTransaction.deleteMany({ where: { masjidId } }),
      prisma.paymentLink.deleteMany({ where: { masjidId } }),
      prisma.campaign.deleteMany({ where: { masjidId } }),
      prisma.budget.deleteMany({ where: { masjidId } }),
      prisma.fundTransfer.deleteMany({ where: { masjidId } }),
      prisma.income.deleteMany({ where: { masjidId } }),
      prisma.recurringExpense.deleteMany({ where: { masjidId } }),
      prisma.expense.deleteMany({ where: { masjidId } }),
      prisma.recurringDonation.deleteMany({ where: { masjidId } }),
      prisma.donation.deleteMany({ where: { masjidId } }),
      prisma.fund.deleteMany({ where: { masjidId } }),
      prisma.incomeCategory.deleteMany({ where: { masjidId } }),
      prisma.expenseCategory.deleteMany({ where: { masjidId } }),
      prisma.donationCategory.deleteMany({ where: { masjidId } }),
      prisma.donor.deleteMany({ where: { masjidId } }),
      prisma.setting.deleteMany({ where: { masjidId } }),
      prisma.notification.deleteMany({ where: { masjidId } }),
      prisma.auditLog.deleteMany({ where: { masjidId } }),
      prisma.masjidFinancialYear.deleteMany({ where: { masjidId } }),
      prisma.masjidUser.deleteMany({ where: { masjidId } }),
      prisma.masjid.delete({ where: { id: masjidId } }),
    ]);

    // Clean up orphaned users
    for (const uId of userIds) {
      const remaining = await prisma.masjidUser.count({ where: { userId: uId } });
      if (remaining === 0) {
        const u = await prisma.user.findUnique({ where: { id: uId } });
        if (u && u.role !== 'SUPER_ADMIN') {
          await prisma.user.delete({ where: { id: uId } }).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Masjid "${masjid.name}" permanently deleted.`,
    });
  } catch (error: any) {
    if (error.name === 'TenantAccessError' || error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Super Admin Delete Masjid error:', error);
    return NextResponse.json({ error: 'Delete failed: ' + (error.message || '') }, { status: 500 });
  }
}

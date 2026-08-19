import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, requireTenantWriteAccess } from '@/lib/tenant';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = requireTenantAccess();
    const isSuperAdmin = session.role === 'SUPER_ADMIN';
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    if (isSuperAdmin) {
      const where: any = {};
      if (statusFilter && statusFilter !== 'ALL') {
        where.status = statusFilter;
      }

      const requests = await prisma.paymentOnboardingRequest.findMany({
        where,
        include: {
          masjid: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              state: true,
              waqfId: true,
              regNumber: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ success: true, requests });
    }

    // For Mosque Admin: Fetch their own mosque's payment request history & latest status
    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session.masjidId || '' },
          { slug: 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Mosque not found' }, { status: 404 });
    }

    const requests = await prisma.paymentOnboardingRequest.findMany({
      where: { masjidId: masjid.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      latestRequest: requests[0] || null,
      requests,
      masjidName: masjid.name,
    });
  } catch (error: any) {
    console.error('Payment Requests GET API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payment requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireTenantWriteAccess();
    const body = await req.json();

    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session.masjidId || '' },
          { slug: 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Mosque not found' }, { status: 404 });
    }

    const {
      requestType,
      upiId,
      upiPayeeName,
      bankName,
      bankAccNo,
      bankIfsc,
      razorpayKeyId,
      razorpayKeySecret,
      razorpayWebhookSecret,
      chequeDocUrl,
      registrationDocUrl,
      idProofDocUrl,
      notes,
    } = body;

    if (!requestType) {
      return NextResponse.json({ error: 'Request type (UPI, Razorpay, or Both) is required' }, { status: 400 });
    }

    // Always enforce the locked single source of truth masjid name as the beneficiary
    const enforcedPayeeName = upiPayeeName?.trim() || masjid.name;

    const paymentReq = await prisma.paymentOnboardingRequest.create({
      data: {
        masjidId: masjid.id,
        requestType,
        upiId: upiId || null,
        upiPayeeName: enforcedPayeeName,
        bankName: bankName || null,
        bankAccNo: bankAccNo || null,
        bankIfsc: bankIfsc || null,
        razorpayKeyId: razorpayKeyId || null,
        razorpayKeySecret: razorpayKeySecret || null,
        razorpayWebhookSecret: razorpayWebhookSecret || null,
        chequeDocUrl: chequeDocUrl || null,
        registrationDocUrl: registrationDocUrl || null,
        idProofDocUrl: idProofDocUrl || null,
        notes: notes || null,
        status: 'PENDING',
      },
    });

    // Create system notification for Super Admin
    await recordAuditLog({
      masjidId: masjid.id,
      userId: session.userId || 'system',
      userEmail: session.email || 'admin@masjid.org',
      action: 'PAYMENT_ONBOARDING_REQUESTED',
      entity: 'PaymentOnboardingRequest',
      entityId: paymentReq.id,
      afterState: {
        requestId: paymentReq.id,
        requestType,
        upiId,
        bankName,
        masjidName: masjid.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment setup request submitted successfully. Super Admin has been notified for verification.',
      request: paymentReq,
    });
  } catch (error: any) {
    console.error('Payment Requests POST API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit payment request' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = requireTenantWriteAccess();
    if (session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admin can review payment onboarding requests' }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, action, rejectionReason, customPayeeName } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 });
    }

    const paymentReq = await prisma.paymentOnboardingRequest.findUnique({
      where: { id: requestId },
      include: { masjid: true },
    });

    if (!paymentReq) {
      return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
    }

    const masjidId = paymentReq.masjidId;
    let newStatus = paymentReq.status;

    if (action === 'APPROVE') {
      newStatus = 'APPROVED';

      const activePayee = customPayeeName?.trim() || paymentReq.upiPayeeName || paymentReq.masjid.name;
      const enableUpi = paymentReq.requestType === 'UPI' || paymentReq.requestType === 'BOTH';
      const enableRazorpay = paymentReq.requestType === 'RAZORPAY' || paymentReq.requestType === 'BOTH';

      // 1. Update Mosque Core record
      await prisma.masjid.update({
        where: { id: masjidId },
        data: {
          upiId: paymentReq.upiId || paymentReq.masjid.upiId,
          bankName: paymentReq.bankName || paymentReq.masjid.bankName,
          bankAccNo: paymentReq.bankAccNo || paymentReq.masjid.bankAccNo,
          bankIfsc: paymentReq.bankIfsc || paymentReq.masjid.bankIfsc,
        },
      });

      // 2. Update Settings table with verified credentials
      const settingsToUpsert = [
        { key: 'upiId', value: paymentReq.upiId || '' },
        { key: 'upiPayeeName', value: activePayee },
        { key: 'enableUpi', value: String(enableUpi) },
        { key: 'enableRazorpay', value: String(enableRazorpay) },
        { key: 'bankName', value: paymentReq.bankName || '' },
        { key: 'bankAccNo', value: paymentReq.bankAccNo || '' },
        { key: 'bankIfsc', value: paymentReq.bankIfsc || '' },
      ];

      if (paymentReq.razorpayKeyId) {
        settingsToUpsert.push({ key: 'razorpayKeyId', value: paymentReq.razorpayKeyId });
      }
      if (paymentReq.razorpayKeySecret) {
        settingsToUpsert.push({ key: 'razorpayKeySecret', value: paymentReq.razorpayKeySecret });
      }
      if (paymentReq.razorpayWebhookSecret) {
        settingsToUpsert.push({ key: 'razorpayWebhookSecret', value: paymentReq.razorpayWebhookSecret });
      }

      for (const s of settingsToUpsert) {
        await prisma.setting.upsert({
          where: {
            masjidId_key: { masjidId, key: s.key },
          },
          update: { value: s.value },
          create: { masjidId, key: s.key, value: s.value },
        });
      }
    } else if (action === 'UNDER_REVIEW') {
      newStatus = 'UNDER_REVIEW';
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
    } else if (action === 'RESUBMIT_REQUIRED') {
      newStatus = 'RESUBMIT_REQUIRED';
    } else {
      return NextResponse.json({ error: 'Invalid action provided' }, { status: 400 });
    }

    const updated = await prisma.paymentOnboardingRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        rejectionReason: (action === 'REJECT' || action === 'RESUBMIT_REQUIRED') ? (rejectionReason || 'Documents or bank details verification incomplete') : null,
        reviewedBy: session.email || 'superadmin@masjidpay.org',
        reviewedAt: new Date(),
      },
    });

    await recordAuditLog({
      masjidId,
      userId: session.userId || 'superadmin',
      userEmail: session.email || 'superadmin@masjidpay.org',
      action: `PAYMENT_REQUEST_${action}`,
      entity: 'PaymentOnboardingRequest',
      entityId: requestId,
      afterState: {
        requestId,
        newStatus,
        rejectionReason,
        masjidName: paymentReq.masjid.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payment request status successfully updated to ${newStatus}`,
      request: updated,
    });
  } catch (error: any) {
    console.error('Payment Requests PATCH API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update payment request' }, { status: 500 });
  }
}

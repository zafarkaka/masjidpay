import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAccess, requireTenantWriteAccess } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = requireTenantAccess();
    const isViewer = session.role === 'VIEWER' || session.role === 'COMMUNITY_VIEWER';

    const masjid = await prisma.masjid.findFirst({
      where: {
        OR: [
          { id: session.masjidId || '' },
          { slug: 'jama-masjid' },
        ],
      },
    });

    if (!masjid) {
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    const settingsList = await prisma.setting.findMany({
      where: { masjidId: masjid.id },
    });

    const settingsMap: Record<string, string> = {};
    settingsList.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    // Redact sensitive secrets for guest/viewer accounts
    const sanitizedMasjid = isViewer
      ? { ...masjid, communityAccessCode: undefined }
      : masjid;

    return NextResponse.json({
      success: true,
      masjid: sanitizedMasjid,
      gateway: {
        razorpayKeyId: isViewer ? '' : (settingsMap['razorpayKeyId'] || process.env.RAZORPAY_KEY_ID || ''),
        razorpayKeySecret: isViewer ? '' : (settingsMap['razorpayKeySecret'] || ''),
        razorpayWebhookSecret: isViewer ? '' : (settingsMap['razorpayWebhookSecret'] || ''),
        enableRazorpay: settingsMap['enableRazorpay'] === 'true',
        enableUpi: settingsMap['enableUpi'] !== 'false',
        upiId: masjid.upiId || settingsMap['upiId'] || 'jama.masjid@upi',
        bankName: masjid.bankName || settingsMap['bankName'] || 'State Bank of India',
        bankAccNo: masjid.bankAccNo || settingsMap['bankAccNo'] || '38920194821',
        bankIfsc: masjid.bankIfsc || settingsMap['bankIfsc'] || 'SBIN0001234',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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
      return NextResponse.json({ error: 'Masjid not found' }, { status: 404 });
    }

    // Update Masjid profile
    const updatedMasjid = await prisma.masjid.update({
      where: { id: masjid.id },
      data: {
        name: body.name || masjid.name,
        address: body.address !== undefined ? body.address : masjid.address,
        city: body.city || masjid.city,
        state: body.state || masjid.state,
        zipCode: body.zipCode !== undefined ? body.zipCode : masjid.zipCode,
        phone: body.phone || masjid.phone,
        email: body.email || masjid.email,
        regNumber: body.regNumber !== undefined ? body.regNumber : masjid.regNumber,
        waqfId: body.waqfId !== undefined ? body.waqfId : masjid.waqfId,
        bankName: body.bankName !== undefined ? body.bankName : masjid.bankName,
        bankAccNo: body.bankAccNo !== undefined ? body.bankAccNo : masjid.bankAccNo,
        bankIfsc: body.bankIfsc !== undefined ? body.bankIfsc : masjid.bankIfsc,
        upiId: body.upiId !== undefined ? body.upiId : masjid.upiId,
        financialYear: body.financialYear || masjid.financialYear,
        communityAccessCode: (body.communityAccessCode && body.communityAccessCode.trim() && body.communityAccessCode.trim() !== '0')
          ? body.communityAccessCode.trim()
          : (masjid.communityAccessCode || '7860'),
      },
    });

    // Save gateway settings in Setting table
    const gatewayKeys = [
      'razorpayKeyId',
      'razorpayKeySecret',
      'razorpayWebhookSecret',
      'enableRazorpay',
      'enableUpi',
      'upiId',
      'bankName',
      'bankAccNo',
      'bankIfsc',
    ];

    for (const key of gatewayKeys) {
      if (body[key] !== undefined) {
        await prisma.setting.upsert({
          where: { masjidId_key: { masjidId: masjid.id, key } },
          update: { value: String(body[key]) },
          create: { masjidId: masjid.id, key, value: String(body[key]) },
        });
      }
    }

    return NextResponse.json({
      success: true,
      masjid: updatedMasjid,
      message: 'Masjid settings and Payment Gateway API keys updated successfully',
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

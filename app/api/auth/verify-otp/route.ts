import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseTables } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP code are required' }, { status: 400 });
    }

    await ensureDatabaseTables(prisma);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const record = await prisma.otpVerification.findUnique({
      where: { email: cleanEmail },
    }).catch(() => null);

    if (!record) {
      return NextResponse.json({ error: 'No OTP request found for this email' }, { status: 400 });
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json({ error: 'Verification OTP has expired. Please request a new code.' }, { status: 400 });
    }

    if (record.otp !== cleanOtp) {
      return NextResponse.json({ error: 'Invalid verification OTP code. Please check and try again.' }, { status: 400 });
    }

    // OTP Verified! Delete used record
    await prisma.otpVerification.delete({ where: { email: cleanEmail } }).catch(() => {});

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Email address verified successfully!',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP code' }, { status: 500 });
  }
}

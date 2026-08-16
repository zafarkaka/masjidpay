import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseTables } from '@/lib/db-init';
import { verifyOtpToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, otpToken } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP code are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // 1. Verify via signed cryptographic token (Stateless & Serverless immune to container restarts)
    if (otpToken) {
      const tokenPayload = verifyOtpToken(otpToken);
      if (tokenPayload && tokenPayload.email.toLowerCase() === cleanEmail) {
        if (tokenPayload.otp === cleanOtp) {
          // Delete from DB if present
          try {
            await prisma.otpVerification.delete({ where: { email: cleanEmail } });
          } catch (e) {}

          return NextResponse.json({
            success: true,
            verified: true,
            message: 'Email address verified successfully!',
          });
        } else {
          return NextResponse.json({ error: 'Invalid verification OTP code. Please check and try again.' }, { status: 400 });
        }
      }
    }

    // 2. Database verification fallback
    await ensureDatabaseTables(prisma);

    const record = await prisma.otpVerification.findUnique({
      where: { email: cleanEmail },
    }).catch(() => null);

    if (record) {
      if (new Date() > record.expiresAt) {
        return NextResponse.json({ error: 'Verification OTP has expired. Please request a new code.' }, { status: 400 });
      }

      if (record.otp === cleanOtp) {
        await prisma.otpVerification.delete({ where: { email: cleanEmail } }).catch(() => {});
        return NextResponse.json({
          success: true,
          verified: true,
          message: 'Email address verified successfully!',
        });
      } else {
        return NextResponse.json({ error: 'Invalid verification OTP code. Please check and try again.' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid or expired verification OTP. Please click Resend Code.' }, { status: 400 });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP code' }, { status: 500 });
  }
}

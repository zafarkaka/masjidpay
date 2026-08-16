import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyOtpToken } from '@/lib/auth';
import { ensureDatabaseTables } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword, otpToken } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Email, OTP code, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await ensureDatabaseTables(prisma);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    let isOtpValid = false;

    // 1. Verify via signed cryptographic token
    if (otpToken) {
      const decoded = verifyOtpToken(otpToken);
      if (decoded && decoded.email.toLowerCase() === cleanEmail && decoded.otp === cleanOtp) {
        isOtpValid = true;
      }
    }

    // 2. Fallback verify via database
    if (!isOtpValid) {
      const otpRecord = await prisma.otpVerification.findUnique({
        where: { email: cleanEmail },
      }).catch(() => null);

      if (otpRecord && otpRecord.otp === cleanOtp && new Date() <= new Date(otpRecord.expiresAt)) {
        isOtpValid = true;
      }
    }

    if (!isOtpValid) {
      return NextResponse.json({ error: 'Invalid or expired 6-digit OTP code' }, { status: 400 });
    }

    // Hash new password & update User record
    const hashedPassword = await hashPassword(newPassword);
    const updatedUser = await prisma.user.update({
      where: { email: cleanEmail },
      data: { password: hashedPassword },
    }).catch(() => null);

    // Delete used OTP
    await prisma.otpVerification.delete({ where: { email: cleanEmail } }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
      email: updatedUser?.email || cleanEmail,
    });
  } catch (error: any) {
    console.error('Reset Password API error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}

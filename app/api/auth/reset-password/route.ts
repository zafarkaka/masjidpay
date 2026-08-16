import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Email, OTP code, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify OTP record
    const otpRecord = await prisma.otpVerification.findUnique({
      where: { email: cleanEmail },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'No OTP verification request found for this email' }, { status: 400 });
    }

    if (otpRecord.otp !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid 6-digit OTP code' }, { status: 400 });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      return NextResponse.json({ error: 'OTP code has expired. Please request a new code.' }, { status: 400 });
    }

    // 2. Hash new password & update User record
    const hashedPassword = await hashPassword(newPassword);
    const updatedUser = await prisma.user.update({
      where: { email: cleanEmail },
      data: { password: hashedPassword },
    });

    // 3. Delete used OTP
    await prisma.otpVerification.delete({
      where: { email: cleanEmail },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
      email: updatedUser.email,
    });
  } catch (error: any) {
    console.error('Reset Password API error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}

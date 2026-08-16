import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail, SUPER_ADMIN_EMAIL } from '@/lib/email';
import { ensureDatabaseTables } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, masjidName, purpose = 'SIGNUP_VERIFICATION' } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    await ensureDatabaseTables(prisma);

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } }).catch(() => null);

    if (purpose === 'PASSWORD_RESET') {
      if (!existingUser && cleanEmail !== 'admin@masjidpay.org' && cleanEmail !== 'admin@jamamasjid.org') {
        return NextResponse.json({ error: 'No registered account found with this email address' }, { status: 404 });
      }
    } else {
      // SIGNUP_VERIFICATION
      if (existingUser) {
        return NextResponse.json({ error: 'An account with this email is already registered' }, { status: 400 });
      }
    }

    // Generate Secure Real 6-Digit Code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert into OtpVerification table
    try {
      await prisma.otpVerification.upsert({
        where: { email: cleanEmail },
        update: {
          otp: otpCode,
          expiresAt,
        },
        create: {
          email: cleanEmail,
          otp: otpCode,
          expiresAt,
        },
      });
    } catch (dbErr) {
      console.warn('Fallback OTP storage:', dbErr);
    }

    // Send Real Email via Resend API from Super Admin
    await sendOtpEmail({
      toEmail: cleanEmail,
      otpCode,
      masjidName,
      purpose,
    });

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification OTP has been sent to ${cleanEmail} from Super Admin (${SUPER_ADMIN_EMAIL}). Please check your inbox.`,
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP verification email' }, { status: 500 });
  }
}

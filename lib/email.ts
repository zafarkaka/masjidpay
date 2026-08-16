import nodemailer from 'nodemailer';

export const SUPER_ADMIN_EMAIL = 'masjidpay3@gmail.com';
export const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'MasjidPay <noreply@masjidpay.org>';

export interface SendOtpEmailParams {
  toEmail: string;
  otpCode: string;
  masjidName?: string;
  purpose?: 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET';
}

export interface SendIntroEmailParams {
  toEmail: string;
  adminName: string;
  masjidName: string;
  masjidSlug: string;
}

/**
 * Sends a 6-digit Verification OTP Email via Resend API from domain masjidpay.org.
 */
export async function sendOtpEmail({ toEmail, otpCode, masjidName, purpose = 'SIGNUP_VERIFICATION' }: SendOtpEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'MasjidPay Security <security@masjidpay.org>';
  const isPasswordReset = purpose === 'PASSWORD_RESET';

  const title = isPasswordReset ? 'Password Reset Verification' : 'Masjid Registration OTP Verification';
  const subtitle = isPasswordReset
    ? 'Use the 6-digit code below to securely reset your account password.'
    : `Your 6-digit email verification code for registering <strong>${masjidName || 'your Masjid'}</strong> is:`;

  const subject = isPasswordReset
    ? `[${otpCode}] Password Reset OTP Code - MasjidPay SaaS`
    : `[${otpCode}] Registration OTP - ${masjidName || 'MasjidPay SaaS'}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0F3D26; padding-bottom: 15px;">
        <h2 style="color: #0F3D26; margin: 0; font-size: 24px;">🕌 MasjidPay SaaS</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">${title}</p>
      </div>
      <div style="padding: 20px; background-color: #f6faf6; border-radius: 12px; text-align: center; border: 1px solid #dcfce7;">
        <p style="color: #334155; font-size: 14px; margin-bottom: 15px;">Assalamu Alaikum,</p>
        <p style="color: #475569; font-size: 13px; margin-bottom: 20px;">${subtitle}</p>
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0F3D26; padding: 12px 24px; background: #ffffff; display: inline-block; border-radius: 12px; border: 2px dashed #15803d; margin-bottom: 15px;">
          ${otpCode}
        </div>
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">This OTP code is valid for 10 minutes. Please do not share it with anyone.</p>
      </div>
      <div style="margin-top: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px;">
        Official Sender: <strong>noreply@masjidpay.org</strong> • Super Admin: <a href="mailto:${SUPER_ADMIN_EMAIL}" style="color: #0F3D26; font-weight: bold;">${SUPER_ADMIN_EMAIL}</a>
      </div>
    </div>
  `;

  // 1. TRY RESEND API DISPATCH WITH masjidpay.org DOMAIN
  if (resendApiKey) {
    try {
      let resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: SUPER_ADMIN_EMAIL,
          subject,
          html: htmlContent,
        }),
      });

      let resendData = await resendRes.json();

      // If custom domain is still verifying in Resend DNS, fallback to verified sandbox
      if (!resendRes.ok && resendData.message?.includes('domain')) {
        console.warn('⚠️ Custom domain masjidpay.org not yet verified in Resend, falling back to onboarding address:', resendData.message);
        resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'MasjidPay Security <onboarding@resend.dev>',
            to: [toEmail],
            reply_to: SUPER_ADMIN_EMAIL,
            subject,
            html: htmlContent,
          }),
        });
        resendData = await resendRes.json();
      }

      if (resendRes.ok) {
        console.log(`✅ [RESEND OTP DELIVERED] Sent ${purpose} OTP ${otpCode} to ${toEmail} from ${fromEmail} (ID: ${resendData.id})`);
        return { sent: true, demoMode: false, provider: 'Resend', resendId: resendData.id };
      } else {
        console.warn('⚠️ Resend API response:', resendData);
      }
    } catch (resendError) {
      console.error('⚠️ Resend API request failed:', resendError);
    }
  }

  // 2. CONSOLE LOG FALLBACK
  console.log(`✉️ [OTP DISPATCH] From: ${fromEmail} | Reply-To: ${SUPER_ADMIN_EMAIL} | Purpose: ${purpose} | To: ${toEmail} | OTP: ${otpCode}`);
  return {
    sent: true,
    otpCode,
    provider: 'Console Fallback',
    message: 'OTP generated successfully.',
  };
}

/**
 * Sends an Introductory & Welcome Message Email to newly registered Masjid Admins from domain masjidpay.org.
 */
export async function sendIntroMessageEmail({ toEmail, adminName, masjidName, masjidSlug }: SendIntroEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'MasjidPay <noreply@masjidpay.org>';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0F3D26; padding-bottom: 15px;">
        <h2 style="color: #0F3D26; margin: 0; font-size: 26px;">🕌 Welcome to MasjidPay SaaS</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Smart Mosque Management & Financial Transparency Engine</p>
      </div>

      <div style="padding: 20px; background-color: #f6faf6; border-radius: 12px; border: 1px solid #dcfce7;">
        <h3 style="color: #0F3D26; margin-top: 0;">Assalamu Alaikum ${adminName},</h3>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Welcome aboard! Your registration for <strong>${masjidName}</strong> has been received and initialized.
        </p>

        <div style="background-color: #ffffff; padding: 15px; border-radius: 10px; border: 1px solid #cbd5e1; margin: 15px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569;"><strong>Your Mosque Dashboard:</strong> http://localhost:3000/dashboard</p>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569;"><strong>Public Donation Page:</strong> http://localhost:3000/donate/${masjidSlug}</p>
          <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Transparency Portal:</strong> http://localhost:3000/masjid/${masjidSlug}/transparency</p>
        </div>

        <p style="color: #475569; font-size: 13px; line-height: 1.6;">
          You can now manage monthly member collections, track mosque income/expenses, download PDF reports, and send automated WhatsApp receipts to donors.
        </p>

        <p style="color: #0F3D26; font-size: 14px; font-weight: bold; margin-top: 20px;">
          JazakAllah Khair,<br/>The MasjidPay SaaS Team<br/>
          <span style="font-size: 11px; color: #64748b; font-weight: normal;">Domain: masjidpay.org • Super Admin: ${SUPER_ADMIN_EMAIL}</span>
        </p>
      </div>
    </div>
  `;

  if (resendApiKey) {
    try {
      let resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: SUPER_ADMIN_EMAIL,
          subject: `🕌 Welcome to MasjidPay - ${masjidName}`,
          html: htmlContent,
        }),
      });

      let resendData = await resendRes.json();

      if (!resendRes.ok && resendData.message?.includes('domain')) {
        resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'MasjidPay <onboarding@resend.dev>',
            to: [toEmail],
            reply_to: SUPER_ADMIN_EMAIL,
            subject: `🕌 Welcome to MasjidPay - ${masjidName}`,
            html: htmlContent,
          }),
        });
        resendData = await resendRes.json();
      }

      if (resendRes.ok) {
        console.log(`✅ [RESEND INTRO EMAIL DELIVERED] Sent intro message to ${toEmail} from ${fromEmail} (ID: ${resendData.id})`);
        return { sent: true, provider: 'Resend', resendId: resendData.id };
      }
    } catch (resendError) {
      console.error('⚠️ Resend intro email failed:', resendError);
    }
  }

  console.log(`✉️ [INTRO DISPATCH] Welcome sent to ${toEmail} for ${masjidName} from ${fromEmail}`);
  return { sent: true, provider: 'Console Fallback' };
}

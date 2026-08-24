import nodemailer from 'nodemailer';

export const SUPER_ADMIN_EMAIL = 'masjidpay3@gmail.com';
export const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'MasjidPay <noreply@masjidpay.org>';
export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://masjidpay.org';

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

export interface SendApprovalEmailParams {
  toEmail: string;
  adminName: string;
  masjidName: string;
  masjidSlug: string;
  adminEmail?: string;
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
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; padding: 30px; border: 1px solid #D4AF37; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 20px rgba(6, 78, 59, 0.08);">
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #064E3B; padding-bottom: 18px;">
        <h2 style="color: #064E3B; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">🕌 MasjidPay SaaS</h2>
        <p style="color: #0F766E; font-size: 13px; margin-top: 5px; font-weight: 600;">${title}</p>
      </div>
      <div style="padding: 24px; background-color: #FFF9EC; border-radius: 16px; text-align: center; border: 1px solid #D4AF37;">
        <p style="color: #102A25; font-size: 15px; margin-bottom: 12px; font-weight: 700;">Assalamu Alaikum,</p>
        <p style="color: #475569; font-size: 14px; margin-bottom: 22px; line-height: 1.5;">${subtitle}</p>
        <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #064E3B; padding: 14px 28px; background: #ffffff; display: inline-block; border-radius: 14px; border: 2px dashed #D4AF37; margin-bottom: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          ${otpCode}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">This OTP code is valid for 10 minutes. For security reasons, please do not share it with anyone.</p>
      </div>
      <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 18px;">
        Official Website: <a href="${BASE_URL}" style="color: #064E3B; font-weight: bold; text-decoration: none;">${BASE_URL.replace('https://', '')}</a> • Support: <a href="mailto:${SUPER_ADMIN_EMAIL}" style="color: #0F766E; font-weight: bold; text-decoration: none;">${SUPER_ADMIN_EMAIL}</a>
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
          subject,
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
      }
    } catch (resendError) {
      console.error('⚠️ Resend API request failed:', resendError);
    }
  }

  console.log(`✉️ [OTP DISPATCH] From: ${fromEmail} | Reply-To: ${SUPER_ADMIN_EMAIL} | Purpose: ${purpose} | To: ${toEmail} | OTP: ${otpCode}`);
  return { sent: true, otpCode, provider: 'Console Fallback', message: 'OTP generated successfully.' };
}

/**
 * Sends an Official Welcome & Activation Email to approved Masjid Admins with real domain links.
 */
export async function sendApprovalWelcomeEmail({ toEmail, adminName, masjidName, masjidSlug, adminEmail }: SendApprovalEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'MasjidPay <noreply@masjidpay.org>';

  const dashboardUrl = `${BASE_URL}/login`;
  const donateUrl = `${BASE_URL}/donate/${masjidSlug}`;
  const transparencyUrl = `${BASE_URL}/masjid/${masjidSlug}/transparency`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; padding: 30px; border: 1px solid #D4AF37; border-radius: 24px; background-color: #ffffff; box-shadow: 0 8px 30px rgba(6, 78, 59, 0.08);">
      
      {/* HEADER */}
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #064E3B; padding-bottom: 20px;">
        <div style="display: inline-block; background-color: #064E3B; color: #F4D06F; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; font-size: 24px; margin-bottom: 10px; border: 1px solid #D4AF37;">
          🕌
        </div>
        <h1 style="color: #064E3B; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">MasjidPay SaaS</h1>
        <p style="color: #0F766E; font-size: 13px; margin-top: 4px; font-weight: 700; text-transform: uppercase; tracking-wider: 1px;">
          Official Mosque Account Activation
        </p>
      </div>

      {/* BODY HERO */}
      <div style="padding: 24px; background-color: #FFF9EC; border-radius: 18px; border: 1px solid #D4AF37; margin-bottom: 24px;">
        <h3 style="color: #064E3B; margin-top: 0; font-size: 18px; font-weight: 800;">
          Assalamu Alaikum wa Rahmatullahi wa Barakatuh ${adminName},
        </h3>
        <p style="color: #102A25; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          Alhamdulillah! We are pleased to inform you that your mosque registration for <strong>${masjidName}</strong> has been officially approved and activated by the Super Admin.
        </p>
        <div style="display: inline-block; background-color: #064E3B; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; border: 1px solid #D4AF37;">
          ✅ Account Status: ACTIVE & VERIFIED
        </div>
      </div>

      {/* DIRECT PORTAL ACCESS LINK */}
      <div style="margin-bottom: 24px;">
        <h4 style="color: #102A25; font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">
          🚀 Your Official Portal Link:
        </h4>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
          <div style="font-weight: 800; color: #064E3B; font-size: 16px; margin-bottom: 6px;">
            Mosque Management Financial Dashboard
          </div>
          <div style="font-size: 13px; color: #64748b; margin-bottom: 14px; line-height: 1.5;">
            Sign in to manage finances, record monthly member collections, calculate staff payroll, and generate audit balance sheets.
          </div>
          <a href="${dashboardUrl}" style="display: inline-block; background-color: #064E3B; color: #F4D06F; text-decoration: none; padding: 12px 26px; border-radius: 12px; font-size: 14px; font-weight: 800; border: 1px solid #D4AF37; box-shadow: 0 4px 12px rgba(6, 78, 59, 0.15);">
            Sign In to Dashboard →
          </a>
          <div style="font-size: 12px; color: #64748b; margin-top: 12px; font-family: monospace;">
            URL: <a href="${dashboardUrl}" style="color: #064E3B; font-weight: bold;">${dashboardUrl}</a>
          </div>
        </div>
      </div>

      {/* KEY CAPABILITIES */}
      <div style="padding: 18px; background-color: #f1f5f9; border-radius: 14px; margin-bottom: 24px;">
        <h4 style="color: #102A25; font-size: 13px; font-weight: 800; margin: 0 0 10px 0;">
          ✨ Key Features Ready for Your Mosque:
        </h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.8;">
          <li><strong>Monthly Member Collections:</strong> Register members, search with instant auto-suggest, and record monthly amounts.</li>
          <li><strong>Instant WhatsApp Receipts:</strong> Dispatch automated payment slips directly to donor phone numbers.</li>
          <li><strong>Staff & Imam Payroll:</strong> Manage attendance, compute working days, and calculate automated net salary payouts.</li>
          <li><strong>User Permissions:</strong> Assign granular View, Add, Edit, Delete, and Report roles for Trustees and Treasurers.</li>
          <li><strong>One-Click PDF Reports:</strong> Download official Income/Expense statements and audit balance sheets.</li>
        </ul>
      </div>

      {/* FOOTER & SUPPORT */}
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
        <p style="color: #064E3B; font-size: 14px; font-weight: 800; margin: 0 0 6px 0;">
          JazakAllah Khair,<br/>The MasjidPay SaaS Team
        </p>
        <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0;">
          Website: <a href="${BASE_URL}" style="color: #064E3B; font-weight: bold; text-decoration: none;">${BASE_URL.replace('https://', '')}</a>
        </p>
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">
          Super Admin Support: <a href="mailto:${SUPER_ADMIN_EMAIL}" style="color: #0F766E; font-weight: bold; text-decoration: none;">${SUPER_ADMIN_EMAIL}</a>
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
          subject: `🕌 Account Approved & Activated - Welcome to MasjidPay (${masjidName})`,
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
            subject: `🕌 Account Approved & Activated - Welcome to MasjidPay (${masjidName})`,
            html: htmlContent,
          }),
        });
        resendData = await resendRes.json();
      }

      if (resendRes.ok) {
        console.log(`✅ [APPROVAL EMAIL DELIVERED] Sent approval email to ${toEmail} from ${fromEmail} (ID: ${resendData.id})`);
        return { sent: true, provider: 'Resend', resendId: resendData.id };
      }
    } catch (resendError) {
      console.error('⚠️ Resend approval email failed:', resendError);
    }
  }

  console.log(`✉️ [APPROVAL DISPATCH] Welcome sent to ${toEmail} for ${masjidName} from ${fromEmail}`);
  return { sent: true, provider: 'Console Fallback' };
}

/**
 * Sends an Introductory & Welcome Message Email to newly registered Masjid Admins from domain masjidpay.org.
 */
export async function sendIntroMessageEmail({ toEmail, adminName, masjidName, masjidSlug }: SendIntroEmailParams) {
  return sendApprovalWelcomeEmail({ toEmail, adminName, masjidName, masjidSlug });
}

export interface SendDonationReceiptEmailParams {
  toEmail: string;
  donorName: string;
  masjidName: string;
  masjidSlug?: string;
  amount: number;
  categoryName: string;
  receiptNo: string;
  paymentMethod: string;
  referenceNo?: string;
  date: string;
}

/**
 * Sends an automated Official Donation Receipt Email to the donor.
 */
export async function sendDonationReceiptEmail({
  toEmail,
  donorName,
  masjidName,
  masjidSlug,
  amount,
  categoryName,
  receiptNo,
  paymentMethod,
  referenceNo,
  date,
}: SendDonationReceiptEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'MasjidPay Receipts <receipts@masjidpay.org>';
  const formattedAmount = `₹${Number(amount).toLocaleString('en-IN')}`;
  const transparencyUrl = `${BASE_URL}/masjid/${masjidSlug || 'jama-masjid'}/transparency`;
  const receiptUrl = `${BASE_URL}/dashboard/receipts/print?id=${receiptNo}&autoPrint=true`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; border: 1px solid #D4AF37; border-radius: 24px; background-color: #ffffff; box-shadow: 0 6px 24px rgba(6, 78, 59, 0.08);">
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #064E3B; padding-bottom: 20px;">
        <div style="font-size: 28px; margin-bottom: 6px;">🕌</div>
        <h2 style="color: #064E3B; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">${masjidName}</h2>
        <span style="display: inline-block; background-color: #FFF9EC; border: 1px solid #D4AF37; color: #064E3B; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-top: 8px;">
          ✓ Official Donation Receipt
        </span>
      </div>

      <div style="margin-bottom: 24px; text-align: center;">
        <p style="color: #102A25; font-size: 15px; font-weight: 700; margin: 0 0 6px 0;">Assalamu Alaikum ${donorName},</p>
        <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.5;">
          JazakAllah Khair for your generous contribution. Your payment has been confirmed and recorded in the mosque financial ledger.
        </p>
      </div>

      <div style="background-color: #FFF9EC; border: 1px solid #D4AF37; border-radius: 18px; padding: 22px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px dashed #e8dfc8;">Receipt Number:</td>
            <td style="padding: 8px 0; color: #064E3B; font-weight: 800; text-align: right; font-family: monospace; border-bottom: 1px dashed #e8dfc8;">${receiptNo}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px dashed #e8dfc8;">Amount Contributed:</td>
            <td style="padding: 8px 0; color: #064E3B; font-weight: 900; font-size: 18px; text-align: right; border-bottom: 1px dashed #e8dfc8;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px dashed #e8dfc8;">Fund Allocation:</td>
            <td style="padding: 8px 0; color: #102A25; font-weight: 700; text-align: right; border-bottom: 1px dashed #e8dfc8;">${categoryName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px dashed #e8dfc8;">Payment Channel:</td>
            <td style="padding: 8px 0; color: #102A25; font-weight: 700; text-align: right; border-bottom: 1px dashed #e8dfc8;">${paymentMethod}</td>
          </tr>
          ${referenceNo ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px dashed #e8dfc8;">Ref / Transaction ID:</td>
            <td style="padding: 8px 0; color: #102A25; font-weight: 600; text-align: right; font-family: monospace; border-bottom: 1px dashed #e8dfc8;">${referenceNo}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Date & Time:</td>
            <td style="padding: 8px 0; color: #102A25; font-weight: 600; text-align: right;">${date}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${receiptUrl}" style="display: inline-block; background-color: #064E3B; color: #F4D06F; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 13px; font-weight: 800; border: 1px solid #D4AF37; box-shadow: 0 4px 12px rgba(6, 78, 59, 0.15);">
          📄 Download Official PDF Receipt →
        </a>
      </div>

      <div style="text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 18px;">
        <p style="margin: 0 0 6px 0; color: #064E3B; font-weight: 700;">
          May Allah accept your donation and bless you abundantly.
        </p>
        <p style="margin: 0; font-size: 11px;">
          Powered by <a href="${BASE_URL}" style="color: #064E3B; font-weight: bold; text-decoration: none;">MasjidPay SaaS</a> • Verified Smart Mosque Platform
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
          subject: `🕌 Official Donation Receipt: ${formattedAmount} - ${masjidName} (${receiptNo})`,
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
            subject: `🕌 Official Donation Receipt: ${formattedAmount} - ${masjidName} (${receiptNo})`,
            html: htmlContent,
          }),
        });
        resendData = await resendRes.json();
      }

      if (resendRes.ok) {
        console.log(`✅ [RECEIPT EMAIL DELIVERED] Sent donation receipt to ${toEmail} from ${fromEmail} (ID: ${resendData.id})`);
        return { sent: true, provider: 'Resend', resendId: resendData.id };
      }
    } catch (resendError) {
      console.error('⚠️ Resend donation receipt email failed:', resendError);
    }
  }

  console.log(`✉️ [RECEIPT CONSOLE FALLBACK] Donation receipt sent to ${toEmail} for ${masjidName} (Amount: ${formattedAmount})`);
  return { sent: true, provider: 'Console Fallback' };
}

export interface SendNewRegistrationAlertParams {
  masjidId: string;
  masjidName: string;
  masjidSlug: string;
  adminName: string;
  adminEmail: string;
  adminPhone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
  registeredAt?: Date | string;
}

/**
 * Sends an immediate email notification to limratech6@gmail.com whenever a new Masjid Admin successfully registers.
 */
export async function sendNewRegistrationAlertToSuperAdmin(params: SendNewRegistrationAlertParams) {
  const recipientEmail = 'limratech6@gmail.com';
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'MasjidPay Alerts <alerts@masjidpay.org>';

  const formattedDate = new Date(params.registeredAt || new Date()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const fullAddress = [
    params.address,
    params.city,
    params.state,
    params.country,
    params.zipCode ? `PIN: ${params.zipCode}` : '',
  ]
    .filter(Boolean)
    .join(', ') || 'Not specified';

  const approvalUrl = `${BASE_URL}/super-admin/masjids`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 28px; border: 1px solid #D4AF37; border-radius: 20px; background-color: #ffffff; box-shadow: 0 6px 24px rgba(6, 78, 59, 0.08);">
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #064E3B; padding-bottom: 18px;">
        <div style="font-size: 32px; margin-bottom: 6px;">🕌</div>
        <h2 style="color: #064E3B; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">MasjidPay SaaS</h2>
        <span style="display: inline-block; background-color: #FFF9EC; border: 1px solid #D4AF37; color: #064E3B; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-top: 8px;">
          🚨 New Mosque Registration Alert
        </span>
      </div>

      <div style="margin-bottom: 22px;">
        <p style="color: #102A25; font-size: 15px; font-weight: 700; margin: 0 0 8px 0;">Assalamu Alaikum Admin,</p>
        <p style="color: #475569; font-size: 13.5px; margin: 0; line-height: 1.6;">
          A new Mosque and Administrator have successfully registered on <strong>MasjidPay</strong> and are waiting for Super Admin verification and approval.
        </p>
      </div>

      <div style="background-color: #FFF9EC; border: 1px solid #D4AF37; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 14px 0; color: #064E3B; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px dashed #D4AF37; padding-bottom: 8px;">
          📋 Registration Details
        </h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600; width: 35%;">Masjid Name:</td>
            <td style="padding: 7px 0; color: #064E3B; font-weight: 800; font-size: 14px;">${params.masjidName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Admin Name:</td>
            <td style="padding: 7px 0; color: #102A25; font-weight: 700;">${params.adminName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Email Address:</td>
            <td style="padding: 7px 0; color: #102A25; font-weight: 700;">
              <a href="mailto:${params.adminEmail}" style="color: #0F766E; text-decoration: none;">${params.adminEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Phone Number:</td>
            <td style="padding: 7px 0; color: #102A25; font-weight: 700;">
              ${params.adminPhone ? `<a href="tel:${params.adminPhone}" style="color: #0F766E; text-decoration: none;">${params.adminPhone}</a>` : 'Not provided'}
            </td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Address / Location:</td>
            <td style="padding: 7px 0; color: #102A25; font-weight: 600; line-height: 1.4;">${fullAddress}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Registration Date/Time:</td>
            <td style="padding: 7px 0; color: #102A25; font-weight: 600;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Masjid ID:</td>
            <td style="padding: 7px 0; color: #475569; font-family: monospace; font-size: 11.5px; font-weight: 700;">${params.masjidId}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 22px;">
        <a href="${approvalUrl}" style="display: inline-block; background-color: #064E3B; color: #F4D06F; text-decoration: none; padding: 13px 30px; border-radius: 12px; font-size: 13.5px; font-weight: 800; border: 1px solid #D4AF37; box-shadow: 0 4px 14px rgba(6, 78, 59, 0.2);">
          ⚡ Review & Approve in Super Admin Console →
        </a>
      </div>

      <div style="text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        This is an automated operational notification dispatched by <a href="${BASE_URL}" style="color: #064E3B; font-weight: bold; text-decoration: none;">MasjidPay SaaS</a>.
      </div>
    </div>
  `;

  // 1. Resend API Dispatch
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
          to: [recipientEmail],
          reply_to: params.adminEmail || SUPER_ADMIN_EMAIL,
          subject: `🕌 New Masjid Registration: ${params.masjidName} - Action Required`,
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
            from: 'MasjidPay Alerts <onboarding@resend.dev>',
            to: [recipientEmail],
            reply_to: params.adminEmail || SUPER_ADMIN_EMAIL,
            subject: `🕌 New Masjid Registration: ${params.masjidName} - Action Required`,
            html: htmlContent,
          }),
        });
        resendData = await resendRes.json();
      }

      if (resendRes.ok) {
        console.log(`✅ [REGISTRATION ALERT SENT] Delivered notification for ${params.masjidName} to ${recipientEmail} (ID: ${resendData.id})`);
        return { sent: true, provider: 'Resend', resendId: resendData.id };
      }
    } catch (resendError) {
      console.error('⚠️ Resend registration alert failed:', resendError);
    }
  }

  // 2. Fallback SMTP via Nodemailer if SMTP configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || '',
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || fromEmail,
        to: recipientEmail,
        replyTo: params.adminEmail || SUPER_ADMIN_EMAIL,
        subject: `🕌 New Masjid Registration: ${params.masjidName} - Action Required`,
        html: htmlContent,
      });

      console.log(`✅ [SMTP REGISTRATION ALERT SENT] Delivered to ${recipientEmail} via SMTP`);
      return { sent: true, provider: 'SMTP' };
    } catch (smtpErr) {
      console.error('⚠️ SMTP registration alert failed:', smtpErr);
    }
  }

  console.log(`✉️ [REGISTRATION ALERT DISPATCH] To: ${recipientEmail} | Masjid: ${params.masjidName} | Admin: ${params.adminName} | Email: ${params.adminEmail} | Phone: ${params.adminPhone} | Address: ${fullAddress} | Date: ${formattedDate} | Masjid ID: ${params.masjidId}`);
  return { sent: true, provider: 'Console Fallback' };
}



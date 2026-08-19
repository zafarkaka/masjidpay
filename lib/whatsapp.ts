export interface WhatsAppInvoiceInput {
  phone: string;
  memberName: string;
  amount: number;
  monthsCount?: number;
  forMonths?: string;
  paymentDate: string;
  receiptNo?: string;
  masjidName?: string;
  paymentMethod?: string;
  monthlyAmount?: number;
  statusText?: string;
  transparencyUrl?: string;
}

export function generateWhatsAppInvoiceUrl({
  phone,
  memberName,
  amount,
  monthsCount = 1,
  forMonths,
  paymentDate,
  receiptNo,
  masjidName = 'NEWTOWN MASJID',
  monthlyAmount,
  statusText = '✅ Fully Paid',
  transparencyUrl,
}: WhatsAppInvoiceInput): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  let message = `━━━━━━━━━━━━━━━━━━━━━
🕌 *${masjidName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━━

📝 *MEMBER DONATION RECEIPT*

Assalamu Alaikum ${memberName},

*Payment Details:*
• *Donor Name:* ${memberName}
• *Phone:* ${phone}
• *Receipt No:* ${receiptNo || 'N/A'}
• *Date:* ${paymentDate}
• *Total Paid:* IN ₹ ${amount.toLocaleString('en-IN')}
${forMonths ? `• *Period Covered:* ${forMonths}` : ''}
${monthsCount > 1 ? `• *Months Count:* ${monthsCount} Months (Bulk Payment)` : ''}

*Status:* ${statusText}
Alhamdulillah, your contribution has been recorded in the mosque financial ledger.`;

  if (transparencyUrl) {
    message += `\n\n🔍 *Live Transparency Portal:*\n${transparencyUrl}`;
  }

  message += `\n\n━━━━━━━━━━━━━━━━━━━━━\nMay Allah accept your donations.\n\nJazakAllah Khair!\n━━━━━━━━━━━━━━━━━━━━━`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

export interface WhatsAppDonationReceiptInput {
  phone: string;
  donorName: string;
  amount: number;
  categoryName: string;
  paymentDate: string;
  receiptNo: string;
  masjidName: string;
  paymentMethod?: string;
  referenceNo?: string;
  transparencyUrl?: string;
}

export function generateWhatsAppDonationReceiptUrl({
  phone,
  donorName,
  amount,
  categoryName,
  paymentDate,
  receiptNo,
  masjidName,
  paymentMethod = 'UPI',
  referenceNo,
  transparencyUrl,
}: WhatsAppDonationReceiptInput): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  let message = `━━━━━━━━━━━━━━━━━━━━━
🕌 *${masjidName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━━

✨ *OFFICIAL DONATION RECEIPT*

Assalamu Alaikum *${donorName}*,

JazakAllah Khair for your generous contribution towards the house of Allah.

📜 *Receipt No:* ${receiptNo}
💰 *Amount Paid:* IN ₹ ${amount.toLocaleString('en-IN')}
🏷️ *Fund Allocation:* ${categoryName}
💳 *Payment Channel:* ${paymentMethod}
${referenceNo ? `🔢 *Ref / UPI Trans ID:* ${referenceNo}\n` : ''}📅 *Contribution Date:* ${paymentDate}
✅ *Status:* Confirmed & Recorded in Ledger

May Allah (SWT) accept your charity, grant immense barakah in your sustenance, and reward you and your family with the best in this world and the hereafter.`;

  if (transparencyUrl) {
    message += `\n\n🔍 *Track Masjid Transparency:*\n${transparencyUrl}`;
  }

  message += `\n\n━━━━━━━━━━━━━━━━━━━━━\n*MasjidPay Verified Digital Receipt*\n━━━━━━━━━━━━━━━━━━━━━`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

export interface MemberStatusWhatsAppInput {
  phone: string;
  memberName: string;
  memberNo?: string;
  monthlyRate: number;
  totalPaid: number;
  pendingAmount: number;
  statusText: string;
  statusType: 'ADVANCE' | 'FULLY_PAID' | 'PENDING';
  advanceAmount?: number;
  paidTillMonth?: string;
  pendingMonthsList?: string[];
  masjidName?: string;
}

export function generateMemberStatusWhatsAppUrl({
  phone,
  memberName,
  memberNo,
  monthlyRate,
  totalPaid,
  pendingAmount,
  statusText,
  statusType,
  advanceAmount = 0,
  paidTillMonth,
  pendingMonthsList = [],
  masjidName = 'NEWTOWN MASJID',
}: MemberStatusWhatsAppInput): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  let message = `━━━━━━━━━━━━━━━━━━━━━
🕌 *${masjidName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━━

📋 *MONTHLY MEMBER SUBSCRIPTION STATUS*

Assalamu Alaikum *${memberName}*,

• *Member ID:* ${memberNo || 'MBR'}
• *Monthly Rate:* IN ₹ ${monthlyRate.toLocaleString('en-IN')}/mo
• *Total Paid:* IN ₹ ${totalPaid.toLocaleString('en-IN')}`;

  if (statusType === 'ADVANCE') {
    message += `
• *Pending Due:* IN ₹ 0
• *Status:* 🟢 *Fully Paid (+IN ₹${advanceAmount.toLocaleString('en-IN')} Adv)*
${paidTillMonth ? `• *Paid in Advance Till:* ${paidTillMonth}` : ''}

Alhamdulillah, you have paid in advance. JazakAllah Khair for your continuous support!`;
  } else if (statusType === 'FULLY_PAID') {
    message += `
• *Pending Due:* IN ₹ 0
• *Status:* ✅ *Fully Paid (Up to date)*
${paidTillMonth ? `• *Paid Till:* ${paidTillMonth}` : ''}

Alhamdulillah, your monthly subscription is completely up to date. JazakAllah Khair!`;
  } else {
    const monthsCount = pendingMonthsList.length || Math.max(1, Math.ceil(pendingAmount / (monthlyRate || 100)));
    message += `
• *Pending Amount Due:* IN ₹ ${pendingAmount.toLocaleString('en-IN')}
• *Status:* ⚠️ *${monthsCount === 1 ? '1 Month Pending' : `${monthsCount} Months Pending`}*
${pendingMonthsList.length > 0 ? `• *Pending Months:* ${pendingMonthsList.join(', ')}` : ''}

Kindly clear your pending contribution when convenient to support ongoing mosque expenses.`;
  }

  message += `\n\n━━━━━━━━━━━━━━━━━━━━━\nMay Allah accept your donations.\n━━━━━━━━━━━━━━━━━━━━━`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

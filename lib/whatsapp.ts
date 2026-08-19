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
  // Clean phone number (strip non-digits)
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

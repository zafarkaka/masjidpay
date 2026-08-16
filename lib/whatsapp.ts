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
}: WhatsAppInvoiceInput): string {
  // Clean phone number (strip non-digits)
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  const displayMonthlyAmount = monthlyAmount || (monthsCount > 1 ? Math.round(amount / monthsCount) : amount);

  const message = `━━━━━━━━━━━━━━━━━━━━━
🕌 *${masjidName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━━

📝 *PAYMENT STATUS*

Assalamu Alaikum ${memberName},

*Your Details:*
Name: ${memberName}
Phone: ${phone}
Joining Date: ${paymentDate}
Monthly Amount: IN ₹ ${displayMonthlyAmount.toLocaleString('en-IN')}

*Status:* ${statusText}
You have no pending payments. JazakAllah Khair for your contributions!

━━━━━━━━━━━━━━━━━━━━━
May Allah accept your donations.

JazakAllah Khair!
━━━━━━━━━━━━━━━━━━━━━`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

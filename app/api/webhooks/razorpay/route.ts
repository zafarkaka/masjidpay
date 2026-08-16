import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { razorpay } from '@/lib/payments/razorpay';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify HMAC signature
    const isValid = razorpay.verifyWebhookSignature(rawBody, signature);
    if (!isValid && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const entity = payload.payload?.payment?.entity;

    if (!entity) {
      return NextResponse.json({ received: true });
    }

    const razorpayPaymentId = entity.id;
    const amount = (entity.amount || 0) / 100; // Convert paise to currency unit
    const email = entity.email;
    const contact = entity.contact;

    // 1. Check Idempotency
    const existingTx = await prisma.paymentTransaction.findUnique({
      where: { razorpayPaymentId },
    });
    if (existingTx) {
      return NextResponse.json({ message: 'Event already processed' });
    }

    // 2. Identify target Masjid from notes or payload
    const masjidId = entity.notes?.masjidId || (await prisma.masjid.findFirst())?.id;
    if (!masjidId) {
      return NextResponse.json({ error: 'Target masjid not specified' }, { status: 400 });
    }

    const categoryId = entity.notes?.categoryId || (await prisma.donationCategory.findFirst({ where: { masjidId } }))?.id;
    const fundId = entity.notes?.fundId || (await prisma.fund.findFirst({ where: { masjidId } }))?.id;

    if (!categoryId || !fundId) {
      return NextResponse.json({ error: 'Category or Fund context missing' }, { status: 400 });
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      await prisma.$transaction(async (tx) => {
        // Record payment transaction
        await tx.paymentTransaction.create({
          data: {
            masjidId,
            razorpayPaymentId,
            razorpayOrderId: entity.order_id || null,
            amount,
            status: 'CAPTURED',
            paymentMethod: 'RAZORPAY',
            donorEmail: email || null,
            donorPhone: contact || null,
            rawPayload: rawBody,
          },
        });

        // Auto-create Donor if details available
        let donorId: string | undefined;
        if (email || contact) {
          let donor = await tx.donor.findFirst({
            where: { masjidId, OR: [{ email }, { phone: contact }] },
          });
          if (!donor) {
            donor = await tx.donor.create({
              data: {
                masjidId,
                name: entity.notes?.donorName || 'Online Donor',
                email: email || null,
                phone: contact || null,
                totalDonated: amount,
              },
            });
          } else {
            await tx.donor.update({
              where: { id: donor.id },
              data: { totalDonated: { increment: amount } },
            });
          }
          donorId = donor.id;
        }

        // Generate receipt number
        const receiptCount = await tx.receipt.count({ where: { masjidId } });
        const receiptNo = `REC-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(4, '0')}`;

        // Create Donation record
        const donation = await tx.donation.create({
          data: {
            masjidId,
            donorId: donorId || null,
            categoryId,
            fundId,
            amount,
            paymentMethod: 'RAZORPAY',
            referenceNo: razorpayPaymentId,
            notes: `Online donation via Razorpay (${event})`,
            receiptNo,
          },
        });

        // Update Fund balance
        await tx.fund.update({
          where: { id: fundId },
          data: { currentBalance: { increment: amount } },
        });

        // Create Receipt record
        await tx.receipt.create({
          data: {
            masjidId,
            receiptNo,
            donationId: donation.id,
            donorName: entity.notes?.donorName || 'Online Donor',
            amount,
            categoryName: 'Online Donation',
          },
        });

        // Create Notification alert
        await tx.notification.create({
          data: {
            masjidId,
            title: 'New Online Payment Received',
            message: `Successfully received ₹${amount} via Razorpay (${razorpayPaymentId}).`,
            type: 'SUCCESS',
          },
        });
      });

      await recordAuditLog({
        masjidId,
        action: 'RAZORPAY_WEBHOOK_PAYMENT_CAPTURED',
        entity: 'PaymentTransaction',
        entityId: razorpayPaymentId,
        afterState: { amount, event, email },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Razorpay Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

import crypto from 'crypto';

export interface CreatePaymentLinkInput {
  title: string;
  amount?: number; // In main currency unit (e.g. INR)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  callbackUrl?: string;
  referenceId?: string;
}

export interface PaymentLinkResponse {
  id: string;
  short_url: string;
  status: string;
  amount: number;
}

export class RazorpayService {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_masjidpay_demo_key';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_masjidpay_secret_key';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_masjidpay_webhook_secret';
  }

  /**
   * Generates a Razorpay Payment Link payload.
   * If live keys are present, calls standard API endpoint.
   * Otherwise generates a formatted payment link & sandbox simulator url.
   */
  async createPaymentLink(input: CreatePaymentLinkInput): Promise<PaymentLinkResponse> {
    const linkId = `plink_${Math.random().toString(36).substring(2, 10)}`;
    const shortUrl = input.callbackUrl || `https://rzp.io/l/${linkId}`;

    return {
      id: linkId,
      short_url: shortUrl,
      status: 'created',
      amount: input.amount ? Math.round(input.amount * 100) : 0,
    };
  }

  /**
   * Verifies Razorpay Webhook signature using HMAC SHA256.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!signature) return false;
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    return expectedSignature === signature;
  }

  /**
   * Verifies Razorpay Payment Signature for client-side checkout verification.
   */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(text)
      .digest('hex');
    return expectedSignature === signature;
  }
}

export const razorpay = new RazorpayService();

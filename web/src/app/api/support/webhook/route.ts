import { NextResponse } from 'next/server';
import { handleZendeskWebhook } from '@/services/zendeskService';

const ZENDESK_WEBHOOK_SECRET = process.env.ZENDESK_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-zendesk-webhook-signature');
    if (!signature || !verifyWebhookSignature(signature, await request.text())) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const payload = await request.json();
    await handleZendeskWebhook(payload);

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling Zendesk webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

function verifyWebhookSignature(signature: string, body: string): boolean {
  // In a real implementation, you would verify the signature using HMAC
  // For now, we'll just check if the secret is present
  return !!ZENDESK_WEBHOOK_SECRET;
} 
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import Stripe from 'stripe';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payout.paid':
        await handlePayoutSuccess(event.data.object as Stripe.Payout);
        break;

      case 'payout.failed':
        await handlePayoutFailure(event.data.object as Stripe.Payout);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const transactionId = paymentIntent.metadata?.transactionId as string | undefined;
  if (!transactionId) return;

  await runTransaction(db, async (transaction) => {
    const transactionRef = doc(db, 'transactions', transactionId);
    const transactionDoc = await transaction.get(transactionRef);

    if (!transactionDoc.exists()) return;

    const transactionData = transactionDoc.data();
    const portfolioRef = doc(db, 'portfolios', transactionData.portfolioId);
    const portfolioDoc = await transaction.get(portfolioRef);

    if (!portfolioDoc.exists()) return;

    // Update transaction status
    transaction.update(transactionRef, {
      status: 'completed',
      stripePaymentIntentId: paymentIntent.id,
      updatedAt: serverTimestamp(),
    });

    // Update portfolio balance
    transaction.update(portfolioRef, {
      balance: portfolioDoc.data().balance + transactionData.amount,
      updatedAt: serverTimestamp(),
    });
  });
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const transactionId = paymentIntent.metadata?.transactionId as string | undefined;
  if (!transactionId) return;

  await runTransaction(db, async (transaction) => {
    const transactionRef = doc(db, 'transactions', transactionId);
    const transactionDoc = await transaction.get(transactionRef);

    if (!transactionDoc.exists()) return;

    // Update transaction status
    transaction.update(transactionRef, {
      status: 'failed',
      error: paymentIntent.last_payment_error?.message || 'Payment failed',
      updatedAt: serverTimestamp(),
    });
  });
}

async function handlePayoutSuccess(payout: Stripe.Payout) {
  const transactionId = payout.metadata?.transactionId as string | undefined;
  if (!transactionId) return;

  await runTransaction(db, async (transaction) => {
    const transactionRef = doc(db, 'transactions', transactionId);
    const transactionDoc = await transaction.get(transactionRef);

    if (!transactionDoc.exists()) return;

    // Update transaction status
    transaction.update(transactionRef, {
      status: 'completed',
      stripePayoutId: payout.id,
      updatedAt: serverTimestamp(),
    });
  });
}

async function handlePayoutFailure(payout: Stripe.Payout) {
  const transactionId = payout.metadata?.transactionId as string | undefined;
  if (!transactionId) return;

  await runTransaction(db, async (transaction) => {
    const transactionRef = doc(db, 'transactions', transactionId);
    const transactionDoc = await transaction.get(transactionRef);

    if (!transactionDoc.exists()) return;

    const transactionData = transactionDoc.data();
    const portfolioRef = doc(db, 'portfolios', transactionData.portfolioId);
    const portfolioDoc = await transaction.get(portfolioRef);

    if (!portfolioDoc.exists()) return;

    // Update transaction status
    transaction.update(transactionRef, {
      status: 'failed',
      error: payout.failure_message || 'Payout failed',
      updatedAt: serverTimestamp(),
    });

    // Refund the amount back to the portfolio
    transaction.update(portfolioRef, {
      balance: portfolioDoc.data().balance + transactionData.amount,
      updatedAt: serverTimestamp(),
    });
  });
} 
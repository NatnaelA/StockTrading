import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
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
const auth = getAuth(app);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: Request) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { amount, portfolioId, currency = 'usd' } = data;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get portfolio details
    const portfolioDoc = await getDoc(doc(db, 'portfolios', portfolioId));
    if (!portfolioDoc.exists()) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    const portfolioData = portfolioDoc.data();
    if (portfolioData.ownerId !== user.uid) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if user has sufficient balance
    if (portfolioData.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId = portfolioData.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: user.uid,
          portfolioId,
        },
      });
      customerId = customer.id;

      // Update portfolio with Stripe customer ID
      await runTransaction(db, async (transaction) => {
        const portfolioRef = doc(db, 'portfolios', portfolioId);
        transaction.update(portfolioRef, {
          stripeCustomerId: customerId,
          updatedAt: serverTimestamp(),
        });
      });
    }

    // Create transaction record
    const transactionRef = await addDoc(collection(db, 'transactions'), {
      type: 'withdrawal',
      amount,
      currency,
      status: 'pending',
      portfolioId,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create Stripe payout
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          transactionId: transactionRef.id,
          portfolioId,
          userId: user.uid,
        },
      },
      {
        stripeAccount: customerId,
      }
    );

    // Update transaction with Stripe payout ID
    await runTransaction(db, async (transaction) => {
      transaction.update(doc(db, 'transactions', transactionRef.id), {
        stripePayoutId: payout.id,
        updatedAt: serverTimestamp(),
      });

      // Deduct amount from portfolio balance
      transaction.update(doc(db, 'portfolios', portfolioId), {
        balance: portfolioData.balance - amount,
        updatedAt: serverTimestamp(),
      });
    });

    return NextResponse.json({
      success: true,
      transactionId: transactionRef.id,
      payoutId: payout.id,
      message: 'Withdrawal request processed successfully',
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
} 
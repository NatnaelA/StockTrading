import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';

// Initialize Firebase (you'll need to add your config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Onfido webhook token
const webhookToken = process.env.ONFIDO_WEBHOOK_TOKEN;

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('X-SHA2-Signature');
    if (!signature || !webhookToken) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // TODO: Implement proper signature verification
    // const isValidSignature = verifyWebhookSignature(
    //   await request.text(),
    //   signature,
    //   webhookToken
    // );
    // if (!isValidSignature) {
    //   return NextResponse.json(
    //     { error: 'Invalid webhook signature' },
    //     { status: 401 }
    //   );
    // }

    const data = await request.json();
    const { payload } = data;

    if (payload.resource_type !== 'check' || !payload.object) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    const check = payload.object;
    const checkId = check.id;
    const status = check.status;

    // Find the KYC submission with this check ID
    const kycQuery = query(
      collection(db, 'kyc_submissions'),
      where('checkId', '==', checkId)
    );
    const kycSnapshot = await getDocs(kycQuery);

    if (kycSnapshot.empty) {
      return NextResponse.json(
        { error: 'KYC submission not found' },
        { status: 404 }
      );
    }

    const kycDoc = kycSnapshot.docs[0];
    const kycData = kycDoc.data();
    const userId = kycData.userId;

    // Update KYC submission status
    await updateDoc(doc(db, 'kyc_submissions', kycDoc.id), {
      status: status,
      completedAt: new Date(),
      result: check.result,
    });

    // Update user's KYC status
    await updateDoc(doc(db, 'users', userId), {
      kycStatus: status === 'complete' && check.result === 'clear' ? 'verified' : 'rejected',
      updatedAt: new Date(),
    });

    // If KYC is approved and user is a broker, update their role
    if (status === 'complete' && check.result === 'clear') {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      if (userData?.accountType === 'broker') {
        await updateDoc(doc(db, 'users', userId), {
          role: 'broker',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 
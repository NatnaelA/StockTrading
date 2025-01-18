import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

// Helper function to check if user has access to trade
async function hasTradeAccess(userId: string, tradeData: any): Promise<boolean> {
  // Get portfolio details
  const portfolioDoc = await getDoc(doc(db, 'portfolios', tradeData.portfolioId));
  if (!portfolioDoc.exists()) return false;
  
  const portfolioData = portfolioDoc.data();
  
  // Check if user is portfolio owner
  if (portfolioData.ownerId === userId) return true;

  // Get firm details
  const firmDoc = await getDoc(doc(db, 'brokerageFirms', tradeData.firmId));
  if (!firmDoc.exists()) return false;
  
  const firmData = firmDoc.data();
  
  // Check if user is broker in the firm
  return (
    firmData.admins.includes(userId) ||
    firmData.seniorBrokers.includes(userId) ||
    firmData.juniorBrokers.includes(userId)
  );
}

export async function GET(
  request: Request,
  { params }: { params: { tradeId: string } }
) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tradeId } = params;

    // Get trade details
    const tradeDoc = await getDoc(doc(db, 'trades', tradeId));
    if (!tradeDoc.exists()) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    const tradeData = {
      id: tradeDoc.id,
      ...tradeDoc.data(),
    };

    // Check if user has access to trade
    const hasAccess = await hasTradeAccess(user.uid, tradeData);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json({ trade: tradeData });
  } catch (error) {
    console.error('Error fetching trade details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade details' },
      { status: 500 }
    );
  }
} 
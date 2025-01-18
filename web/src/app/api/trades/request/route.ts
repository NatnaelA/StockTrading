import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
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

// Helper function to check if user is junior broker
async function isJuniorBroker(userId: string, firmId: string): Promise<boolean> {
  const firmDoc = await getDoc(doc(db, 'brokerageFirms', firmId));
  if (!firmDoc.exists()) return false;
  const firmData = firmDoc.data();
  return firmData.juniorBrokers.includes(userId);
}

// Helper function to check if user has permission to trade for portfolio
async function hasTradePermission(userId: string, portfolioId: string): Promise<boolean> {
  const portfolioDoc = await getDoc(doc(db, 'portfolios', portfolioId));
  if (!portfolioDoc.exists()) return false;
  
  const portfolioData = portfolioDoc.data();
  const firmDoc = await getDoc(doc(db, 'brokerageFirms', portfolioData.firmId));
  if (!firmDoc.exists()) return false;
  
  const firmData = firmDoc.data();
  return (
    firmData.admins.includes(userId) ||
    firmData.seniorBrokers.includes(userId) ||
    firmData.juniorBrokers.includes(userId)
  );
}

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
    const {
      symbol,
      quantity,
      orderType,
      side,
      limitPrice,
      portfolioId,
      notes,
    } = data;

    // Validate required fields
    if (!symbol || !quantity || !orderType || !side || !portfolioId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has permission to trade for this portfolio
    const hasPermission = await hasTradePermission(user.uid, portfolioId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get portfolio and firm details
    const portfolioDoc = await getDoc(doc(db, 'portfolios', portfolioId));
    const portfolioData = portfolioDoc.data();
    const firmId = portfolioData?.firmId;

    // Check if junior broker needs approval
    const needsApproval = await isJuniorBroker(user.uid, firmId);

    // Create trade request
    const tradeRef = await addDoc(collection(db, 'trades'), {
      symbol,
      quantity,
      orderType,
      side,
      limitPrice,
      portfolioId,
      notes,
      status: needsApproval ? 'pending_broker_approval' : 'pending_client_approval',
      requestedBy: user.uid,
      firmId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create audit log
    await addDoc(collection(db, 'auditLogs'), {
      action: 'TRADE_REQUEST_CREATED',
      tradeId: tradeRef.id,
      portfolioId,
      firmId,
      userId: user.uid,
      details: {
        symbol,
        quantity,
        orderType,
        side,
        limitPrice,
        status: needsApproval ? 'pending_broker_approval' : 'pending_client_approval',
      },
      timestamp: serverTimestamp(),
    });

    // TODO: Send notification to senior broker or client

    return NextResponse.json({
      success: true,
      tradeId: tradeRef.id,
      needsApproval,
      message: needsApproval
        ? 'Trade request submitted for broker approval'
        : 'Trade request submitted for client approval',
    });
  } catch (error) {
    console.error('Error creating trade request:', error);
    return NextResponse.json(
      { error: 'Failed to create trade request' },
      { status: 500 }
    );
  }
} 
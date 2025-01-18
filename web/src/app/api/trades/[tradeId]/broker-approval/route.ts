import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
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

// Helper function to check if user is senior broker or admin
async function canApproveTrades(userId: string, firmId: string): Promise<boolean> {
  const firmDoc = await getDoc(doc(db, 'brokerageFirms', firmId));
  if (!firmDoc.exists()) return false;
  
  const firmData = firmDoc.data();
  return (
    firmData.admins.includes(userId) ||
    firmData.seniorBrokers.includes(userId)
  );
}

export async function POST(
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
    const data = await request.json();
    const { approved, notes } = data;

    // Get trade details
    const tradeDoc = await getDoc(doc(db, 'trades', tradeId));
    if (!tradeDoc.exists()) {
      return NextResponse.json(
        { error: 'Trade request not found' },
        { status: 404 }
      );
    }

    const tradeData = tradeDoc.data();
    
    // Verify trade is pending broker approval
    if (tradeData.status !== 'pending_broker_approval') {
      return NextResponse.json(
        { error: 'Trade is not pending broker approval' },
        { status: 400 }
      );
    }

    // Check if user has permission to approve trades
    const hasPermission = await canApproveTrades(user.uid, tradeData.firmId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update trade status
    const newStatus = approved ? 'pending_client_approval' : 'rejected';
    await updateDoc(doc(db, 'trades', tradeId), {
      status: newStatus,
      brokerApprovalBy: user.uid,
      brokerApprovalAt: serverTimestamp(),
      brokerNotes: notes,
      updatedAt: serverTimestamp(),
    });

    // Create audit log
    await addDoc(collection(db, 'auditLogs'), {
      action: approved ? 'TRADE_BROKER_APPROVED' : 'TRADE_BROKER_REJECTED',
      tradeId,
      portfolioId: tradeData.portfolioId,
      firmId: tradeData.firmId,
      userId: user.uid,
      details: {
        status: newStatus,
        notes,
      },
      timestamp: serverTimestamp(),
    });

    // TODO: Send notification to client if approved, or to requesting broker if rejected

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: approved
        ? 'Trade request approved and sent for client approval'
        : 'Trade request rejected',
    });
  } catch (error) {
    console.error('Error processing broker approval:', error);
    return NextResponse.json(
      { error: 'Failed to process broker approval' },
      { status: 500 }
    );
  }
} 
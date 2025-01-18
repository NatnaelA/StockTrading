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
  runTransaction,
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

// Helper function to check if user is portfolio owner
async function isPortfolioOwner(userId: string, portfolioId: string): Promise<boolean> {
  const portfolioDoc = await getDoc(doc(db, 'portfolios', portfolioId));
  if (!portfolioDoc.exists()) return false;
  const portfolioData = portfolioDoc.data();
  return portfolioData.ownerId === userId;
}

// Helper function to execute trade
async function executeTrade(tradeData: any) {
  // TODO: Integrate with stock market API
  // This is a placeholder that simulates trade execution
  return {
    success: true,
    executionPrice: 100.00, // Mock price
    executedAt: new Date(),
    orderId: 'mock-order-' + Date.now(),
  };
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
    
    // Verify trade is pending client approval
    if (tradeData.status !== 'pending_client_approval') {
      return NextResponse.json(
        { error: 'Trade is not pending client approval' },
        { status: 400 }
      );
    }

    // Check if user is portfolio owner
    const hasPermission = await isPortfolioOwner(user.uid, tradeData.portfolioId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (approved) {
      // Execute trade using transaction to ensure atomicity
      await runTransaction(db, async (transaction) => {
        // Get latest portfolio data
        const portfolioRef = doc(db, 'portfolios', tradeData.portfolioId);
        const portfolioDoc = await transaction.get(portfolioRef);
        if (!portfolioDoc.exists()) {
          throw new Error('Portfolio not found');
        }

        const portfolioData = portfolioDoc.data();
        const currentHoldings = portfolioData.holdings || {};
        const currentBalance = portfolioData.balance || 0;

        // Execute trade through broker API
        const execution = await executeTrade(tradeData);

        // Calculate trade value
        const tradeValue = execution.executionPrice * tradeData.quantity;

        // Validate sufficient balance/holdings
        if (tradeData.side === 'buy' && currentBalance < tradeValue) {
          throw new Error('Insufficient funds');
        }
        if (tradeData.side === 'sell' && 
            (!currentHoldings[tradeData.symbol] || 
             currentHoldings[tradeData.symbol] < tradeData.quantity)) {
          throw new Error('Insufficient shares');
        }

        // Update portfolio
        const updatedHoldings = { ...currentHoldings };
        if (tradeData.side === 'buy') {
          updatedHoldings[tradeData.symbol] = (updatedHoldings[tradeData.symbol] || 0) + tradeData.quantity;
        } else {
          updatedHoldings[tradeData.symbol] = updatedHoldings[tradeData.symbol] - tradeData.quantity;
        }

        transaction.update(portfolioRef, {
          holdings: updatedHoldings,
          balance: tradeData.side === 'buy' 
            ? currentBalance - tradeValue
            : currentBalance + tradeValue,
          updatedAt: serverTimestamp(),
        });

        // Update trade status
        transaction.update(doc(db, 'trades', tradeId), {
          status: 'executed',
          clientApprovalBy: user.uid,
          clientApprovalAt: serverTimestamp(),
          clientNotes: notes,
          executionDetails: execution,
          updatedAt: serverTimestamp(),
        });

        // Create audit log
        const auditLogRef = collection(db, 'auditLogs');
        transaction.set(doc(auditLogRef), {
          action: 'TRADE_EXECUTED',
          tradeId,
          portfolioId: tradeData.portfolioId,
          firmId: tradeData.firmId,
          userId: user.uid,
          details: {
            execution,
            notes,
          },
          timestamp: serverTimestamp(),
        });
      });
    } else {
      // Update trade status to rejected
      await updateDoc(doc(db, 'trades', tradeId), {
        status: 'rejected',
        clientApprovalBy: user.uid,
        clientApprovalAt: serverTimestamp(),
        clientNotes: notes,
        updatedAt: serverTimestamp(),
      });

      // Create audit log for rejection
      await addDoc(collection(db, 'auditLogs'), {
        action: 'TRADE_CLIENT_REJECTED',
        tradeId,
        portfolioId: tradeData.portfolioId,
        firmId: tradeData.firmId,
        userId: user.uid,
        details: {
          notes,
        },
        timestamp: serverTimestamp(),
      });
    }

    // TODO: Send notification to broker about client's decision

    return NextResponse.json({
      success: true,
      status: approved ? 'executed' : 'rejected',
      message: approved
        ? 'Trade executed successfully'
        : 'Trade request rejected',
    });
  } catch (error: any) {
    console.error('Error processing client approval:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process client approval' },
      { status: 500 }
    );
  }
} 
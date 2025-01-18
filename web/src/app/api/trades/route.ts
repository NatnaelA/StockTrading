import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  getDoc,
  doc,
  DocumentData
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

// Helper function to check if user has access to portfolio
async function hasPortfolioAccess(userId: string, portfolioId: string): Promise<boolean> {
  const docRef = doc(db, 'portfolios', portfolioId);
  const portfolioDoc = await getDoc(docRef);
  if (!portfolioDoc.exists()) return false;
  
  const portfolioData = portfolioDoc.data() as DocumentData;
  return portfolioData.ownerId === userId;
}

// Helper function to check if user has access to firm trades
async function hasFirmAccess(userId: string, firmId: string): Promise<boolean> {
  const docRef = doc(db, 'brokerageFirms', firmId);
  const firmDoc = await getDoc(docRef);
  if (!firmDoc.exists()) return false;
  
  const firmData = firmDoc.data() as DocumentData;
  return (
    firmData.admins.includes(userId) ||
    firmData.seniorBrokers.includes(userId) ||
    firmData.juniorBrokers.includes(userId)
  );
}

export async function GET(request: Request) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const firmId = searchParams.get('firmId');

    // Validate access if portfolio or firm ID is provided
    if (portfolioId) {
      const hasAccess = await hasPortfolioAccess(user.uid, portfolioId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    if (firmId) {
      const hasAccess = await hasFirmAccess(user.uid, firmId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Build query based on filters
    let tradesQuery = query(
      collection(db, 'trades'),
      orderBy('createdAt', 'desc')
    );

    if (portfolioId) {
      tradesQuery = query(
        tradesQuery,
        where('portfolioId', '==', portfolioId)
      );
    }

    if (firmId) {
      tradesQuery = query(
        tradesQuery,
        where('firmId', '==', firmId)
      );
    }

    // Get trades
    const tradesSnapshot = await getDocs(tradesQuery);
    const trades = tradesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Error fetching trade requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade requests' },
      { status: 500 }
    );
  }
} 
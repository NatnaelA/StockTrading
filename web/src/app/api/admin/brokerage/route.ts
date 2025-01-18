import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
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

// Helper function to check if user is super admin
async function isSuperAdmin(userId: string): Promise<boolean> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();
  return userData?.role === 'super_admin';
}

// Helper function to check if user is brokerage admin
async function isBrokerageAdmin(userId: string): Promise<boolean> {
  const firmsQuery = query(
    collection(db, 'brokerageFirms'),
    where('admins', 'array-contains', userId)
  );
  const firmsSnapshot = await getDocs(firmsQuery);
  return !firmsSnapshot.empty;
}

export async function GET(request: Request) {
  try {
    // Get current user from auth token
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is super admin or brokerage admin
    const [superAdmin, brokerageAdmin] = await Promise.all([
      isSuperAdmin(user.uid),
      isBrokerageAdmin(user.uid),
    ]);

    if (!superAdmin && !brokerageAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all firms or just the ones the user is admin of
    let firmsQuery;
    if (superAdmin) {
      firmsQuery = collection(db, 'brokerageFirms');
    } else {
      firmsQuery = query(
        collection(db, 'brokerageFirms'),
        where('admins', 'array-contains', user.uid)
      );
    }

    const firmsSnapshot = await getDocs(firmsQuery);
    const firms = firmsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ firms });
  } catch (error) {
    console.error('Error fetching brokerage firms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brokerage firms' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get current user from auth token
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super admin can create new firms
    const superAdmin = await isSuperAdmin(user.uid);
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Only super admin can create new firms' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { name, licenseNumber, address } = data;

    // Validate required fields
    if (!name || !licenseNumber || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if license number is unique
    const existingFirmQuery = query(
      collection(db, 'brokerageFirms'),
      where('licenseNumber', '==', licenseNumber)
    );
    const existingFirmSnapshot = await getDocs(existingFirmQuery);
    if (!existingFirmSnapshot.empty) {
      return NextResponse.json(
        { error: 'License number already exists' },
        { status: 400 }
      );
    }

    // Create new brokerage firm
    const firmRef = await addDoc(collection(db, 'brokerageFirms'), {
      name,
      licenseNumber,
      address,
      admins: [],
      seniorBrokers: [],
      juniorBrokers: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
    });

    return NextResponse.json({
      success: true,
      firmId: firmRef.id,
      message: 'Brokerage firm created successfully',
    });
  } catch (error) {
    console.error('Error creating brokerage firm:', error);
    return NextResponse.json(
      { error: 'Failed to create brokerage firm' },
      { status: 500 }
    );
  }
} 
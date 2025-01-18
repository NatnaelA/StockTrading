import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
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

// Helper function to check if user has permission to manage firm
async function hasPermission(userId: string, firmId: string): Promise<boolean> {
  const firmDoc = await getDoc(doc(db, 'brokerageFirms', firmId));
  if (!firmDoc.exists()) return false;

  const firmData = firmDoc.data();
  return (
    firmData.admins.includes(userId) ||
    (await isSuperAdmin(userId))
  );
}

// Helper function to check if user is super admin
async function isSuperAdmin(userId: string): Promise<boolean> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return false;
  const userData = userDoc.data();
  return userData.role === 'super_admin';
}

export async function POST(
  request: Request,
  { params }: { params: { firmId: string } }
) {
  try {
    const { firmId } = params;
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage firm
    const hasAccess = await hasPermission(user.uid, firmId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { email, role } = data;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'senior', 'junior'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Get or create user account for the invited email
    const usersQuery = collection(db, 'users');
    const userSnapshot = await getDoc(doc(usersQuery, email));
    let userId = email;

    if (!userSnapshot.exists()) {
      // Create a placeholder user document
      await updateDoc(doc(usersQuery, email), {
        email,
        role: `broker-${role}-pending`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        invitedBy: user.uid,
        invitedToFirm: firmId,
      });
    }

    // Update brokerage firm with new broker
    const firmRef = doc(db, 'brokerageFirms', firmId);
    const updateField = role === 'admin'
      ? 'admins'
      : role === 'senior'
      ? 'seniorBrokers'
      : 'juniorBrokers';

    await updateDoc(firmRef, {
      [updateField]: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });

    // Create broker invitation
    await updateDoc(doc(collection(db, 'brokerInvitations'), email), {
      email,
      firmId,
      role,
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      invitedBy: user.uid,
    });

    // TODO: Send invitation email

    return NextResponse.json({
      success: true,
      message: 'Broker invitation sent successfully',
    });
  } catch (error) {
    console.error('Error inviting broker:', error);
    return NextResponse.json(
      { error: 'Failed to invite broker' },
      { status: 500 }
    );
  }
} 
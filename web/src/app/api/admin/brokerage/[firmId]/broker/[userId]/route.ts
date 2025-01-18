import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
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

export async function DELETE(
  request: Request,
  { params }: { params: { firmId: string; userId: string } }
) {
  try {
    const { firmId, userId } = params;
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
    const { role } = data;

    if (!role) {
      return NextResponse.json(
        { error: 'Missing role parameter' },
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

    // Update brokerage firm to remove broker
    const firmRef = doc(db, 'brokerageFirms', firmId);
    const updateField = role === 'admin'
      ? 'admins'
      : role === 'senior'
      ? 'seniorBrokers'
      : 'juniorBrokers';

    await updateDoc(firmRef, {
      [updateField]: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });

    // Update user's role if they're not part of any other firm
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.invitedToFirm === firmId) {
        await updateDoc(userRef, {
          role: 'user',
          invitedToFirm: null,
          updatedAt: serverTimestamp(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Broker removed successfully',
    });
  } catch (error) {
    console.error('Error removing broker:', error);
    return NextResponse.json(
      { error: 'Failed to remove broker' },
      { status: 500 }
    );
  }
} 
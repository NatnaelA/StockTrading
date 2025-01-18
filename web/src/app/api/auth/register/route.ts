import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
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
const auth = getAuth(app);
const db = getFirestore(app);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      accountType,
      dateOfBirth,
      address,
      city,
      country,
      postalCode,
    } = data;

    // 1. Create user account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 2. Send email verification
    await sendEmailVerification(user);

    // 3. Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      firstName,
      lastName,
      email,
      phoneNumber,
      accountType,
      dateOfBirth,
      address,
      city,
      country,
      postalCode,
      role: accountType === 'broker' ? 'broker-pending' : 'individual',
      kycStatus: 'pending',
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 4. Create empty portfolio
    await setDoc(doc(db, 'portfolios', user.uid), {
      userId: user.uid,
      balance: 0,
      positions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      userId: user.uid,
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    let errorMessage = 'Failed to create account';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email is already registered';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
} 
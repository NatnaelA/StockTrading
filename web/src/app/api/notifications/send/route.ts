import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase-admin/messaging';
import { credential } from 'firebase-admin';
import { initializeApp as initializeAdminApp } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
let adminApp;
try {
  adminApp = initializeAdminApp();
} catch {
  adminApp = initializeAdminApp({
    credential: credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

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
const adminMessaging = getMessaging(adminApp);

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
    const { userId, title, body, data: notificationData } = data;

    // Get user's FCM tokens
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const fcmTokens = Object.keys(userData.fcmTokens || {});

    if (fcmTokens.length === 0) {
      return NextResponse.json(
        { error: 'No FCM tokens found for user' },
        { status: 400 }
      );
    }

    // Send notification to all user's devices
    const message = {
      notification: {
        title,
        body,
      },
      data: notificationData,
      tokens: fcmTokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(fcmTokens[idx]);
        }
      });

      // Remove failed tokens from user's document
      if (failedTokens.length > 0) {
        const tokenUpdates = failedTokens.reduce((acc, token) => {
          acc[`fcmTokens.${token}`] = null;
          return acc;
        }, {} as Record<string, any>);

        await updateDoc(doc(db, 'users', userId), tokenUpdates);
      }
    }

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
} 
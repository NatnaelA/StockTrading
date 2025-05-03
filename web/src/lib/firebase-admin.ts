'use server';

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

/**
 * Initialize Firebase Admin SDK if it hasn't been initialized yet
 * This is important for Next.js since it may run initAdmin() multiple times
 */
export async function initAdmin() {
  // Check if app is already initialized to prevent multiple instances
  const apps = getApps();
  
  if (apps.length > 0) {
    // Use existing app instance
    const app = apps[0];
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);
    return { app, db, auth, storage };
  }
  
  // For a production-ready setup, we need to properly initialize Firebase Admin
  // with a service account key
  
  let app: App;
  
  // Check if we're using Firebase emulators for local development
  if (process.env.FIREBASE_USE_EMULATOR === 'true') {
    console.log('Initializing Firebase Admin with emulator settings');
    
    try {
      // Initialize Firebase Admin with minimal config for emulator use
      app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-stock-trading',
      });
      
      // Get services
      const db = getFirestore(app);
      const auth = getAuth(app);
      const storage = getStorage(app);
      
      // For emulator connections, you typically set FIRESTORE_EMULATOR_HOST, 
      // FIREBASE_AUTH_EMULATOR_HOST, etc. environment variables
      // Firebase Admin SDK automatically detects these
      console.log('Firebase Admin initialized for emulator use');
      
      return { app, db, auth, storage };
    } catch (error) {
      console.error('Error initializing Firebase Admin with emulator:', error);
      throw new Error('Failed to initialize Firebase Admin with emulator. Check your configuration.');
    }
  }
  
  // Normal production initialization path
  try {
    // Check for service account JSON in environment variable (preferred method)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('Firebase Admin initialized with service account from environment variable');
    } 
    // If no service account in env var, try file path
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      app = initializeApp({
        credential: cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('Firebase Admin initialized with service account file');
    } 
    // If neither is available, initialize with application default credentials
    else {
      // This requires proper setup with gcloud CLI or cloud environment
      app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('Firebase Admin initialized with application default credentials');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw new Error('Failed to initialize Firebase Admin. Please check your service account credentials.');
  }

  // Initialize and export necessary services
  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);

  return { app, db, auth, storage };
}

// Create a promise for admin services but don't await it yet
// This ensures we only try to initialize once
let adminPromise: Promise<{
  app: App;
  db: Firestore;
  auth: Auth;
  storage: Storage;
}> | null = null;

/**
 * Get the admin services in a way that ensures we only initialize once
 */
async function getAdminPromise() {
  if (!adminPromise) {
    adminPromise = initAdmin();
  }
  return adminPromise;
}

// Export individual service getters for easier use
export async function getAdminDb(): Promise<Firestore> {
  const { db } = await getAdminPromise();
  return db;
}

export async function getAdminAuth(): Promise<Auth> {
  const { auth } = await getAdminPromise();
  return auth;
}

export async function getAdminStorage(): Promise<Storage> {
  const { storage } = await getAdminPromise();
  return storage;
}

export async function getAdminServices() {
  return await getAdminPromise();
} 
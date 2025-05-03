'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth } from '@/lib/firebase-admin';

/**
 * Verifies the session cookie on the server side
 * @returns The decoded user claims or null if not authenticated
 */
export async function verifyServerSession() {
  try {
    const sessionCookie = cookies().get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }
    
    const auth = await getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

/**
 * Gets the current user from the session
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const decodedClaims = await verifyServerSession();
    
    if (!decodedClaims) {
      return null;
    }
    
    const auth = await getAdminAuth();
    const user = await auth.getUser(decodedClaims.uid);
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get the current authenticated user from the session cookie
 * This function can only be called in Server Components or Route Handlers
 */
export async function getServerSession() {
  try {
    // Get the session cookie
    const sessionCookie = cookies().get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }
    
    // Verify the session cookie
    const auth = await getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // Get the user data
    const user = await auth.getUser(decodedClaims.uid);
    
    // Return user data without sensitive information
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL,
      customClaims: user.customClaims,
    };
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

/**
 * Check if the user is authenticated on the server side
 * If not, redirect to the login page
 * This function can only be called in Server Components
 */
export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
}

/**
 * Check if the user has a specific role or permission
 * This function can only be called in Server Components
 */
export async function requireRole(role: string | string[]) {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  const userRole = session.customClaims?.role || 'user';
  
  if (Array.isArray(role)) {
    if (!role.includes(userRole)) {
      redirect('/unauthorized');
    }
  } else {
    if (role !== userRole) {
      redirect('/unauthorized');
    }
  }
  
  return session;
} 
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Session } from '@supabase/supabase-js';

interface UseProtectedRouteOptions {
  redirectTo?: string;
  isPublicRoute?: boolean;
}

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { redirectTo = '/login', isPublicRoute = false } = options;
  const [loading, setLoading] = useState(true); // Remain loading until auth state is confirmed
  const router = useRouter();
  const redirectAttemptedRef = useRef(false); // Track if we've tried to redirect
  const supabase = createClient();

  useEffect(() => {
    console.log('[useProtectedRoute] Hook mounted. Setting up auth listener...');
    let isMounted = true; // Track mount status for async operations
    let redirectInitiated = false; // Prevent multiple redirects

    // First check the session explicitly before setting up the listener
    const checkSessionManually = async () => {
      try {
        console.log('[useProtectedRoute] Running manual session check...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[useProtectedRoute] Error checking session:', error);
          return false;
        }
        
        const isAuthenticated = !!data.session;
        console.log('[useProtectedRoute] Manual session check result:', { 
          hasSession: isAuthenticated,
          userId: data.session?.user?.id || 'none',
          sessionExpiry: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'n/a'
        });
        
        return isAuthenticated;
      } catch (err) {
        console.error('[useProtectedRoute] Exception checking session:', err);
        return false;
      }
    };

    // Process the auth state and determine if a redirect is needed
    const processAuthState = async (isAuthenticated: boolean) => {
      if (!isMounted || redirectInitiated) return; // Ignore if unmounted or redirect already triggered
      
      console.log('[useProtectedRoute] Processing auth state:', { 
        isAuthenticated, 
        isPublicRoute,
        redirectAttempted: redirectAttemptedRef.current
      });

      let shouldRedirect = false;
      let targetUrl = '';

      if (!isAuthenticated && !isPublicRoute) {
        console.log('[useProtectedRoute] Not authenticated on protected route.');
        shouldRedirect = true;
        targetUrl = redirectTo;
      } else if (isAuthenticated && isPublicRoute) {
        console.log('[useProtectedRoute] Authenticated on public route.');
        shouldRedirect = true;
        targetUrl = '/dashboard'; // Default redirect for authenticated users on public routes
      }

      if (shouldRedirect && !redirectAttemptedRef.current) {
        console.log(`[useProtectedRoute] Redirecting to: ${targetUrl}`);
        redirectInitiated = true;
        redirectAttemptedRef.current = true;
        router.push(targetUrl);
        // Keep loading = true because we are navigating away
      } else {
        console.log('[useProtectedRoute] Auth state confirmed, no redirect needed. Finishing loading.');
        // Only stop loading if we are *not* redirecting
        setLoading(false);
      }
    };

    // Check session immediately
    checkSessionManually().then(processAuthState);

    // Set up auth listener for changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[useProtectedRoute] Auth event: ${event}`, { 
        hasSession: !!session, 
        userId: session?.user?.id || 'none',
        isMounted, 
        redirectInitiated,
        sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'n/a'
      });
      
      if (!isMounted) return; // Ignore if unmounted
      
      // Process the auth state after a small delay
      setTimeout(() => {
        processAuthState(!!session);
      }, 50); // Small delay to allow session sync
    });

    return () => {
      console.log('[useProtectedRoute] Unmounting. Unsubscribing auth listener.');
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [router, redirectTo, isPublicRoute]); 

  return { loading }; 
} 
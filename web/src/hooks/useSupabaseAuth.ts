'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { 
  Session, 
  User, 
  AuthError,
  Provider
} from '@supabase/supabase-js';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const listenerSetupRef = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    if (listenerSetupRef.current) return;
    listenerSetupRef.current = true;

    console.log("[useSupabaseAuth] Setting up auth listener...");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[useSupabaseAuth] Auth Event: ${event}`, { hasSession: !!currentSession });
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    const checkInitialSession = async () => {
      console.log("[useSupabaseAuth] Checking initial session...");
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log("[useSupabaseAuth] Initial session check completed.", { 
          hasSession: !!data.session, 
          error: error?.message 
        });
        if (!error && data.session) {
          if (session?.access_token !== data.session.access_token) {
            setSession(data.session);
            setUser(data.session.user);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("[useSupabaseAuth] Error in getInitialSession:", err);
        setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      console.log("[useSupabaseAuth] Cleaning up auth listener.");
      subscription?.unsubscribe();
      listenerSetupRef.current = false;
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { user: null, session: null, error: error as AuthError };
    }
  }, []);

  const signInWithOTP = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { data: null, error: error as AuthError };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return { data: null, error: error as AuthError };
    }
  }, []);

  const signInWithProvider = useCallback(async (provider: Provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      return { data: null, error: error as AuthError };
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { user: null, session: null, error: error as AuthError };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear the session and user data
      setSession(null);
      setUser(null);
      
      // Navigate to login page
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [router]);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      return { session: data.session, error: null };
    } catch (error) {
      console.error('Error refreshing session:', error);
      return { session: null, error: error as AuthError };
    }
  }, []);

  return {
    user,
    session,
    loading,
    signInWithEmail,
    signInWithOTP,
    signInWithGoogle,
    signInWithProvider,
    signUpWithEmail,
    signOut,
    refreshSession,
  };
} 
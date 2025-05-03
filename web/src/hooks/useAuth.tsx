"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { User as SupabaseUser } from "@supabase/supabase-js";

// Define the extended user type that includes profile information
export type UserProfile = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone_number?: string;
  account_type?: string;
  role?: string;
  kyc_status?: string;
  profile_completed?: boolean;
};

// The User type for our application, extending the Supabase User
export interface User extends SupabaseUser {
  profile?: UserProfile | null;
}

// Define the authentication context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<User | null>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user: supabaseUser,
    loading: supabaseLoading,
    signInWithEmail,
    signInWithGoogle: supabaseSignInWithGoogle,
    signUpWithEmail,
    signOut: supabaseSignOut,
  } = useSupabaseAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  // Effect to handle user changes
  useEffect(() => {
    if (!supabaseLoading) {
      setUser(supabaseUser as User | null);
      setLoading(false);
    }
  }, [supabaseUser, supabaseLoading]);

  // Sign in with email and password
  const signIn = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    try {
      setError(null);
      const { user, error } = await signInWithEmail(email, password);

      if (error) throw new Error(error.message);
      if (!user) throw new Error("No user returned after sign in");

      return user as User;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error during sign in")
      );
      return null;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setError(null);
      const { error } = await supabaseSignInWithGoogle();

      if (error) throw new Error(error.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Unknown error during Google sign in")
      );
    }
  };

  // Sign up with email and password
  const signUp = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    try {
      setError(null);
      const { user, error } = await signUpWithEmail(email, password);

      if (error) throw new Error(error.message);
      if (!user) throw new Error("No user returned after sign up");

      return user as User;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error during sign up")
      );
      return null;
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      await supabaseSignOut();
      setUser(null);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error during sign out")
      );
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      const { error } = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }).then((res) => res.json());

      if (error) throw new Error(error);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Unknown error during password reset")
      );
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

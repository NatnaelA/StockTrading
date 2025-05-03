"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GoogleSignIn from "@/components/auth/GoogleSignIn";
import { createClient } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";

export default function LoginPage() {
  const router = useRouter();
  const { checkProfileAndRedirect } = useAuthRedirect();
  const { signInWithEmail, signInWithGoogle } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [urlError, setUrlError] = useState("");
  const supabase = createClient();

  // Check for error in URL (from auth callback)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      if (errorParam) {
        console.log("[LoginPage] Error from URL:", errorParam);
        setUrlError(
          errorParam === "session_exchange_error"
            ? "Authentication error. Please try again with the same browser and device."
            : errorParam
        );
      }
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUrlError("");

    try {
      const { user, error: signInError } = await signInWithEmail(
        email,
        password
      );

      if (signInError) {
        throw signInError;
      }

      if (user) {
        // Check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          // Error other than "not found"
          console.error("Error fetching profile:", profileError);
        }

        if (!profile) {
          // Create user profile if it doesn't exist
          const { error: insertError } = await supabase.from("users").insert({
            id: user.id,
            email: user.email,
            created_at: new Date().toISOString(),
            profile_completed: false,
          });

          if (insertError) {
            console.error("Error creating user profile:", insertError);
            throw new Error("Failed to create user profile");
          }

          // Wait briefly for user creation to complete
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // User profile exists or was created, now check completion and redirect.
        await checkProfileAndRedirect(user);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      setUrlError("");

      const { error } = await signInWithGoogle();

      if (error) {
        throw error;
      }

      // The redirect happens automatically
    } catch (err) {
      console.error("Google login error:", err);
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute isPublicRoute redirectTo="/dashboard">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>

          {(error || urlError) && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline">{error || urlError}</span>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleSignIn
                buttonType="signin"
                onSuccess={() => console.log("Google sign-in initiated")}
                onError={(error) => {
                  console.error("Google sign-in error:", error);
                  setError("Failed to sign in with Google. Please try again.");
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

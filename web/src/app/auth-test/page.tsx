"use client";

import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import GoogleSignIn from "@/components/auth/GoogleSignIn";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

export default function AuthTestPage() {
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } =
    useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [userData, setUserData] = useState<string | null>(null);

  // Update userData when user changes
  useEffect(() => {
    if (user) {
      setUserData(JSON.stringify(user, null, 2));
    } else {
      setUserData(null);
    }
  }, [user]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signInWithEmail(email, password);

      if (result.error) {
        setMessage({ type: "error", text: result.error.message });
        return;
      }

      setMessage({ type: "success", text: "Signed in successfully!" });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signUpWithEmail(email, password);

      if (result.error) {
        setMessage({ type: "error", text: result.error.message });
        return;
      }

      setMessage({
        type: "success",
        text: "Signed up successfully! Please check your email for verification.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setMessage({ type: "success", text: "Signed out successfully!" });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  const handleGoogleSuccess = () => {
    setMessage({ type: "success", text: "Google sign-in successful!" });
  };

  const handleGoogleError = (error: Error) => {
    setMessage({
      type: "error",
      text: `Google sign-in error: ${error.message}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Authentication Test</h1>
          <p className="mt-2 text-gray-600">
            Test your Supabase authentication setup
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">User Status</h2>
          {user ? (
            <div>
              <p className="text-green-600 font-medium mb-2">
                ✅ Authenticated
              </p>
              <p className="mb-2">
                <span className="font-medium">User ID:</span> {user.id}
              </p>
              <p className="mb-2">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <button
                onClick={handleSignOut}
                className="w-full py-2 mt-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <p className="text-red-600 font-medium">❌ Not authenticated</p>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Email Authentication</h2>
          <form className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleEmailSignIn}
                className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={handleEmailSignUp}
                className="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Google Authentication</h2>
          <GoogleSignIn
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>

        {userData && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">User Data</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
              {userData}
            </pre>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}

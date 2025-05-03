"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function AuthDebugPage() {
  const { user, session, loading, refreshSession } = useSupabaseAuth();
  const [cookies, setCookies] = useState<string[]>([]);
  const [authCookies, setAuthCookies] = useState<string[]>([]);
  const [refreshResult, setRefreshResult] = useState<any>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Get all cookies
    const allCookies = document.cookie.split(";").map((c) => c.trim());
    setCookies(allCookies);

    // Filter for auth-related cookies
    const authRelated = allCookies.filter(
      (c) => c.includes("auth") || c.includes("supabase") || c.includes("sb-")
    );
    setAuthCookies(authRelated);
  }, []);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    setRefreshResult(null);
    setRefreshError(null);

    try {
      const result = await refreshSession();
      setRefreshResult(result);

      // Update cookie lists after refresh
      const allCookies = document.cookie.split(";").map((c) => c.trim());
      setCookies(allCookies);
      const authRelated = allCookies.filter(
        (c) => c.includes("auth") || c.includes("supabase") || c.includes("sb-")
      );
      setAuthCookies(authRelated);
    } catch (error) {
      console.error("Error refreshing session:", error);
      setRefreshError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Debug Page</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <p className="mb-2">
            <span className="font-medium">Loading:</span>{" "}
            {loading ? "Yes" : "No"}
          </p>
          <p className="mb-2">
            <span className="font-medium">Authenticated:</span>{" "}
            {user ? "Yes" : "No"}
          </p>
          {user && (
            <div className="mb-4">
              <p className="font-medium mb-2">User Information:</p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
          {session && (
            <div className="mb-4">
              <p className="font-medium mb-2">Session Information:</p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(
                  {
                    ...session,
                    access_token: session.access_token
                      ? `${session.access_token.substring(0, 10)}...`
                      : null,
                    refresh_token: session.refresh_token
                      ? `${session.refresh_token.substring(0, 10)}...`
                      : null,
                  },
                  null,
                  2
                )}
              </pre>
              <p className="text-sm mt-2">
                <span className="font-medium">Expires at:</span>{" "}
                {session.expires_at
                  ? new Date(session.expires_at * 1000).toLocaleString()
                  : "Unknown"}
              </p>
            </div>
          )}

          <button
            onClick={handleRefreshSession}
            disabled={isRefreshing}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Session"}
          </button>

          {refreshResult && (
            <div className="mt-4">
              <p className="font-medium mb-2">Refresh Result:</p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(refreshResult, null, 2)}
              </pre>
            </div>
          )}

          {refreshError && (
            <div className="mt-4 text-red-600">
              <p className="font-medium mb-2">Refresh Error:</p>
              <p>{refreshError}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cookie Information</h2>
          <div className="mb-4">
            <p className="font-medium mb-2">Auth Cookies:</p>
            {authCookies.length > 0 ? (
              <ul className="list-disc pl-6">
                {authCookies.map((cookie, index) => (
                  <li key={index} className="mb-1">
                    {cookie}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-red-600">No auth cookies found</p>
            )}
          </div>

          <div>
            <p className="font-medium mb-2">All Cookies:</p>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {cookies.length > 0 ? cookies.join("\n") : "No cookies found"}
            </pre>
          </div>
        </div>

        <div className="flex space-x-4">
          <a
            href="/"
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Home
          </a>
          <a
            href="/dashboard"
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          >
            Dashboard
          </a>
          <a
            href="/login"
            className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
          >
            Login Page
          </a>
        </div>
      </div>
    </div>
  );
}

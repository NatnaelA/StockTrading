"use client";

import { useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function CapturePortfolioHistory({
  portfolioId,
}: {
  portfolioId: string;
}) {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
    details?: string;
    rawError?: any;
  } | null>(null);

  const handleCaptureHistory = async () => {
    if (!user?.id) {
      setResult({
        success: false,
        message: "You must be logged in to capture portfolio history",
      });
      return;
    }

    if (!portfolioId) {
      console.error("No portfolioId provided");
      setResult({
        success: false,
        message: "Missing portfolio ID",
        details: "A portfolio ID is required to capture history",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Add more detailed logging
      console.log("=== Capture Portfolio History Debug ===");
      console.log("Portfolio ID:", portfolioId);
      console.log("User ID:", user.id);

      // Use the server-side API endpoint instead of calling Firebase Function directly
      const response = await fetch(
        `/api/portfolios/${portfolioId}/history/capture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important for including cookies
        }
      );

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to capture portfolio history");
      }

      setResult({
        success: true,
        message: data.message || "Successfully captured portfolio history",
        timestamp: data.timestamp,
      });
    } catch (error: any) {
      console.error("Error capturing portfolio history:", error);

      // Extract error information
      let errorMessage = "Failed to capture portfolio history";
      let errorDetails = error.message || "";

      setResult({
        success: false,
        message: errorMessage,
        details: errorDetails,
        rawError: JSON.stringify(error, null, 2),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleCaptureHistory}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Capturing..." : "Capture Portfolio History"}
      </button>

      {result && (
        <div
          className={`mt-2 p-3 rounded-md ${
            result.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <p>{result.message}</p>
          {result.details && (
            <p className="text-sm mt-1 break-words whitespace-pre-wrap">
              {result.details}
            </p>
          )}
          {result.timestamp && (
            <p className="text-sm mt-1">Timestamp: {result.timestamp}</p>
          )}
          {!result.success && result.rawError && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer">
                Show raw error
              </summary>
              <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                {result.rawError}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

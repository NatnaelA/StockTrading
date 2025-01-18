"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import TradeRequestForm, {
  TradeRequestData,
} from "@/components/TradeRequestForm";
import TradeRequestList from "@/components/TradeRequestList";

interface TradePageProps {
  params: {
    portfolioId: string;
  };
}

export default function TradePage({ params }: TradePageProps) {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSubmit = async (data: TradeRequestData) => {
    try {
      const response = await fetch("/api/trades/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit trade request");
      }

      const result = await response.json();

      // Show success message or redirect
      if (result.needsApproval) {
        router.push(`/trades/${result.tradeId}?status=pending_broker_approval`);
      } else {
        router.push(`/trades/${result.tradeId}?status=pending_client_approval`);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader
        title="New Trade Request"
        description="Submit a new trade request for broker and client approval"
      />

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <TradeRequestForm
          portfolioId={params.portfolioId}
          onSubmit={handleSubmit}
        />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Recent Trade Requests
        </h2>
        <TradeRequestList type="broker" portfolioId={params.portfolioId} />
      </div>
    </div>
  );
}

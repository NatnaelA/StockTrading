"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import DepositForm from "@/components/DepositForm";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function DepositPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const portfolioId = searchParams.get("portfolioId");

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setStatus("success");
      setMessage("Your deposit was successful!");
    } else if (searchParams.get("canceled") === "true") {
      setStatus("error");
      setMessage("The deposit was canceled.");
    }
  }, [searchParams]);

  if (!portfolioId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaTimesCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                No portfolio ID provided. Please try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Deposit Funds"
        description="Add funds to your trading portfolio"
      />

      {status === "success" ? (
        <div className="mt-8 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaCheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{message}</p>
              <div className="mt-4">
                <button
                  onClick={() => router.push(`/portfolio/${portfolioId}`)}
                  className="text-sm font-medium text-green-700 hover:text-green-600"
                >
                  Return to Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : status === "error" ? (
        <div className="mt-8 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaTimesCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{message}</p>
              <div className="mt-4">
                <button
                  onClick={() => setStatus("idle")}
                  className="text-sm font-medium text-red-700 hover:text-red-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <DepositForm
            portfolioId={portfolioId}
            onSuccess={() => {
              // Success will be handled by the URL params after Stripe redirect
            }}
            onError={(error) => {
              setStatus("error");
              setMessage(error);
            }}
          />
        </div>
      )}
    </div>
  );
}

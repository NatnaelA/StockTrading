"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface DepositFormProps {
  portfolioId: string;
  currentBalance?: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function DepositForm({
  portfolioId,
  currentBalance,
  onSuccess,
  onError,
}: DepositFormProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useSupabaseAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (!user) {
        throw new Error("You must be logged in to make a deposit");
      }

      // Call the deposit API endpoint
      const response = await fetch("/api/payments/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: depositAmount,
          portfolioId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process deposit");
      }

      // For demonstration purposes, we'll update the portfolio directly
      // In a real app, this would be handled by a webhook from Stripe
      // Update portfolio balance in Supabase
      const { error: updateError } = await supabase
        .from("portfolios")
        .update({
          balance: (currentBalance || 0) + depositAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", portfolioId);

      if (updateError) {
        console.error("Error updating portfolio balance:", updateError);
        // We don't want to fail the deposit if this update fails
        // as it's just for demonstration purposes
      }

      setAmount("");
      onSuccess();
    } catch (error) {
      console.error("Deposit error:", error);
      onError(
        error instanceof Error ? error.message : "Failed to process deposit"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Amount
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            name="amount"
            id="amount"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
            placeholder="0.00"
            aria-describedby="amount-currency"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            required
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm" id="amount-currency">
              USD
            </span>
          </div>
        </div>
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        disabled={loading}
      >
        {loading ? "Processing..." : "Deposit Funds"}
      </button>
    </form>
  );
}

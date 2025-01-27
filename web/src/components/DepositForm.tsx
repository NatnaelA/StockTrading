"use client";

import { useState } from "react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DepositFormProps {
  portfolioId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function DepositForm({
  portfolioId,
  onSuccess,
  onError,
}: DepositFormProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      // Update portfolio balance in Firestore
      await updateDoc(doc(db, "portfolios", portfolioId), {
        balance: increment(depositAmount),
        updatedAt: new Date().toISOString(),
      });

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700"
        >
          Amount (USD)
        </label>
        <div className="mt-1">
          <input
            type="number"
            name="amount"
            id="amount"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.00"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {loading ? "Processing..." : "Deposit"}
      </button>
    </form>
  );
}

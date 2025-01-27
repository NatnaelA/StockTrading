"use client";

import { useState } from "react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface WithdrawalFormProps {
  portfolioId: string;
  availableBalance: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function WithdrawalForm({
  portfolioId,
  availableBalance,
  onSuccess,
  onError,
}: WithdrawalFormProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const withdrawalAmount = parseFloat(amount);
      if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (withdrawalAmount > availableBalance) {
        throw new Error("Insufficient funds");
      }

      // Update portfolio balance in Firestore
      await updateDoc(doc(db, "portfolios", portfolioId), {
        balance: increment(-withdrawalAmount),
        updatedAt: new Date().toISOString(),
      });

      setAmount("");
      onSuccess();
    } catch (error) {
      console.error("Withdrawal error:", error);
      onError(
        error instanceof Error ? error.message : "Failed to process withdrawal"
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
            max={availableBalance}
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.00"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Available balance: ${availableBalance.toLocaleString()}
        </p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {loading ? "Processing..." : "Withdraw"}
      </button>
    </form>
  );
}

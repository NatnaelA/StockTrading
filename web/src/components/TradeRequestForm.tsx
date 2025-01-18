"use client";

import { useState } from "react";
import { FaSpinner } from "react-icons/fa";

interface TradeRequestFormProps {
  portfolioId: string;
  onSubmit: (data: TradeRequestData) => Promise<void>;
  availableBalance?: number;
  currentHoldings?: { [symbol: string]: number };
}

export interface TradeRequestData {
  symbol: string;
  quantity: number;
  orderType: "market" | "limit";
  side: "buy" | "sell";
  limitPrice?: number;
  portfolioId: string;
  notes?: string;
}

export default function TradeRequestForm({
  portfolioId,
  onSubmit,
  availableBalance = 0,
  currentHoldings = {},
}: TradeRequestFormProps) {
  const [formData, setFormData] = useState<TradeRequestData>({
    symbol: "",
    quantity: 0,
    orderType: "market",
    side: "buy",
    portfolioId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate trade request
      if (!formData.symbol || !formData.quantity) {
        throw new Error("Please fill in all required fields");
      }

      if (formData.quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
      }

      if (formData.orderType === "limit" && !formData.limitPrice) {
        throw new Error("Limit price is required for limit orders");
      }

      // Check if selling more than owned
      if (
        formData.side === "sell" &&
        (currentHoldings[formData.symbol] || 0) < formData.quantity
      ) {
        throw new Error("Insufficient shares for this sale");
      }

      await onSubmit(formData);

      // Reset form after successful submission
      setFormData({
        symbol: "",
        quantity: 0,
        orderType: "market",
        side: "buy",
        portfolioId,
      });
    } catch (error: any) {
      setError(error.message || "Failed to submit trade request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="symbol"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Symbol
          </label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={(e) =>
              setFormData({ ...formData, symbol: e.target.value.toUpperCase() })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label
            htmlFor="side"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Side
          </label>
          <select
            id="side"
            name="side"
            value={formData.side}
            onChange={(e) =>
              setFormData({
                ...formData,
                side: e.target.value as "buy" | "sell",
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                quantity: parseInt(e.target.value) || 0,
              })
            }
            min="1"
            step="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            required
          />
          {formData.side === "sell" && formData.symbol && (
            <p className="mt-1 text-sm text-gray-500">
              Available: {currentHoldings[formData.symbol] || 0} shares
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="orderType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Order Type
          </label>
          <select
            id="orderType"
            name="orderType"
            value={formData.orderType}
            onChange={(e) =>
              setFormData({
                ...formData,
                orderType: e.target.value as "market" | "limit",
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="market">Market</option>
            <option value="limit">Limit</option>
          </select>
        </div>

        {formData.orderType === "limit" && (
          <div>
            <label
              htmlFor="limitPrice"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Limit Price
            </label>
            <input
              type="number"
              id="limitPrice"
              name="limitPrice"
              value={formData.limitPrice || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  limitPrice: parseFloat(e.target.value) || 0,
                })
              }
              min="0.01"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required={formData.orderType === "limit"}
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            "Submit Trade Request"
          )}
        </button>
      </div>
    </form>
  );
}

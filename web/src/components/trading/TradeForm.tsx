"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStockData } from "@/hooks/useStockData";
import { usePortfolio } from "@/hooks/usePortfolio";
import { tradingService } from "@/services/trading";

interface TradeFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function TradeForm({ onSuccess, onError }: TradeFormProps) {
  const { user } = useAuth();
  const { portfolio } = usePortfolio(user?.id || "");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    totalCost: number;
    newBalance: number;
    canAfford: boolean;
  } | null>(null);

  // Get real-time stock data
  const {
    quote,
    loading: quoteLoading,
    error: quoteError,
  } = useStockData(symbol);

  // Calculate preview whenever relevant values change
  useEffect(() => {
    if (quote && quantity && portfolio) {
      const quantityNum = parseInt(quantity);
      const totalCost = quote.price * quantityNum;
      const newBalance =
        orderType === "buy"
          ? portfolio.balance - totalCost
          : portfolio.balance + totalCost;

      setPreview({
        totalCost,
        newBalance,
        canAfford: orderType === "sell" || newBalance >= 0,
      });
    } else {
      setPreview(null);
    }
  }, [quote, quantity, orderType, portfolio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to trade");
      return;
    }

    if (!quote) {
      setError("Please enter a valid stock symbol");
      return;
    }

    const quantityNum = parseInt(quantity);
    if (!quantity || isNaN(quantityNum) || quantityNum <= 0) {
      setError("Please enter a valid quantity (must be greater than 0)");
      return;
    }

    if (orderType === "buy" && preview && !preview.canAfford) {
      setError(
        `Insufficient balance for this purchase. Required: $${preview.totalCost.toFixed(
          2
        )}`
      );
      return;
    }

    if (orderType === "sell") {
      const currentHolding = portfolio?.holdings.find(
        (h) => h.symbol === symbol
      );
      if (!currentHolding || currentHolding.quantity < quantityNum) {
        setError(
          `Insufficient shares. You only have ${
            currentHolding?.quantity || 0
          } shares of ${symbol}`
        );
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      // Create and complete the transaction in one step
      await tradingService.createTransaction(
        user.id,
        symbol.toUpperCase(),
        quantityNum,
        quote.price,
        orderType
      );

      // Generate and store transaction confirmation document
      await tradingService.storeDocument(user.id, {
        type: "transaction_confirmation",
        title: `${orderType.toUpperCase()} ${quantityNum} ${symbol.toUpperCase()}`,
        description: `${orderType.toUpperCase()} ${quantityNum} shares of ${symbol.toUpperCase()} at $${quote.price.toFixed(
          2
        )}`,
        fileUrl: "#", // You would generate and upload a PDF here
        fileType: "pdf",
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
      });

      // Reset form
      setSymbol("");
      setQuantity("");
      setOrderType("buy");
      setPreview(null);

      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process trade";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Place Trade</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="symbol"
            className="block text-sm font-medium text-gray-700"
          >
            Stock Symbol
          </label>
          <input
            type="text"
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., AAPL"
            required
          />
        </div>

        {quote && !quoteLoading && (
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-sm text-gray-600">Current Price</div>
            <div className="text-lg font-semibold text-gray-900">
              ${quote.price.toFixed(2)}
              <span
                className={`ml-2 text-sm ${
                  quote.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {quote.change >= 0 ? "+" : ""}
                {quote.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {quoteError && (
          <div className="p-3 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 text-sm">
            {quoteError}
          </div>
        )}

        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700"
          >
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow positive integers
              if (value === "" || /^\d+$/.test(value)) {
                setQuantity(value);
              }
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            min="1"
            step="1"
            required
            placeholder="Enter quantity"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Order Type
          </label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrderType("buy")}
              className={`py-2 px-4 text-sm font-medium rounded-md ${
                orderType === "buy"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setOrderType("sell")}
              className={`py-2 px-4 text-sm font-medium rounded-md ${
                orderType === "sell"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        {preview && (
          <div className="p-3 rounded-lg bg-gray-50 space-y-2">
            <div>
              <div className="text-sm text-gray-600">Total Cost</div>
              <div className="text-lg font-semibold text-gray-900">
                ${preview.totalCost.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Balance After Trade</div>
              <div
                className={`text-lg font-semibold ${
                  preview.canAfford ? "text-gray-900" : "text-red-600"
                }`}
              >
                ${preview.newBalance.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={
            loading || quoteLoading || !quote || (preview && !preview.canAfford)
          }
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {loading ? "Processing..." : `Place ${orderType.toUpperCase()} Order`}
        </button>
      </form>
    </div>
  );
}

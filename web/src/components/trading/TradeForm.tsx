"use client";

import { useState, useEffect } from "react";
import { useStockData } from "@/hooks/useStockData";
import { useServerPortfolio } from "@/hooks/useServerPortfolio";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface TradeFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Helper type guard to check if holdings are array-style
function hasArrayHoldings(portfolio: any): boolean {
  return Array.isArray(portfolio.holdings);
}

// Helper type guard to check if holdings are object-style
function hasObjectHoldings(portfolio: any): boolean {
  return (
    !Array.isArray(portfolio.holdings) &&
    typeof portfolio.holdings === "object" &&
    portfolio.holdings !== null
  );
}

export default function TradeForm({ onSuccess, onError }: TradeFormProps) {
  // Use Supabase auth for consistency
  const { user } = useSupabaseAuth();
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    totalCost: number;
    newBalance: number;
    canAfford: boolean;
  } | null>(null);

  // Use server portfolio hook instead of direct Firebase access
  const {
    portfolio,
    loading: portfolioLoading,
    error: portfolioError,
    refetch: refetchPortfolio,
  } = useServerPortfolio(user?.id || "");

  const {
    quote,
    loading: quoteLoading,
    error: quoteError,
  } = useStockData(symbol);

  // Find holding and check quantity based on portfolio type
  const findHolding = (
    portfolio: any,
    symbol: string
  ): { hasHolding: boolean; hasEnoughShares: boolean; quantity: number } => {
    if (hasArrayHoldings(portfolio)) {
      const holding = portfolio.holdings.find((h: any) => h.symbol === symbol);
      const quantity = holding?.quantity || 0;
      return {
        hasHolding: !!holding,
        hasEnoughShares: holding && quantity >= Number(quantity),
        quantity,
      };
    } else if (hasObjectHoldings(portfolio)) {
      const holding = portfolio.holdings[symbol];
      const quantity = holding?.quantity || 0;
      return {
        hasHolding: !!holding,
        hasEnoughShares: holding && quantity >= Number(quantity),
        quantity,
      };
    }
    return { hasHolding: false, hasEnoughShares: false, quantity: 0 };
  };

  // Function to create a portfolio if it doesn't exist
  const createPortfolio = async () => {
    if (!user?.id) return null;

    setError(null);

    try {
      const response = await fetch("/api/portfolios/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "My Portfolio",
          initialBalance: 10000, // Starting with $10,000
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.message || "Failed to create portfolio"
        );
      }

      const data = await response.json();

      // Refetch the portfolio after creation
      await refetchPortfolio();

      return data.portfolio;
    } catch (err: any) {
      console.error("Error creating portfolio:", err);
      setError(err.message || "Failed to create portfolio");
      return null;
    }
  };

  // Update preview when relevant data changes
  useEffect(() => {
    if (
      !portfolioLoading &&
      portfolio &&
      quote &&
      quantity &&
      !isNaN(Number(quantity))
    ) {
      const numQuantity = Number(quantity);
      const totalCost = numQuantity * quote.price;

      // Calculate preview based on order type
      if (orderType === "buy") {
        setPreview({
          totalCost,
          newBalance: (portfolio.balance || 0) - totalCost,
          canAfford: (portfolio.balance || 0) >= totalCost,
        });
      } else {
        // Check if user owns the stock and has enough shares
        const { hasEnoughShares } = findHolding(portfolio, symbol);

        setPreview({
          totalCost,
          newBalance: (portfolio.balance || 0) + totalCost,
          canAfford: hasEnoughShares,
        });
      }
    } else {
      setPreview(null);
    }
  }, [portfolio, portfolioLoading, quote, quantity, orderType, symbol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to trade");
      if (onError) onError("You must be logged in to trade");
      return;
    }

    // If no portfolio exists, create one automatically without UI indication
    let currentPortfolio = portfolio;
    if (!currentPortfolio && !portfolioLoading) {
      currentPortfolio = await createPortfolio();

      if (!currentPortfolio) {
        setError("Failed to create a portfolio. Please try again later.");
        if (onError) onError("Failed to create a portfolio");
        return;
      }
    }

    // If still no portfolio after creation attempt
    if (!currentPortfolio) {
      setError("Portfolio data is not available. Please refresh the page.");
      if (onError) onError("Portfolio data is not available");
      return;
    }

    if (!quote) {
      setError("Stock price data is not available");
      if (onError) onError("Stock price data is not available");
      return;
    }

    if (
      !symbol ||
      !quantity ||
      isNaN(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      setError("Please enter a valid symbol and quantity");
      if (onError) onError("Please enter a valid symbol and quantity");
      return;
    }

    // Check if the user can afford the purchase or has enough shares to sell
    if (
      orderType === "buy" &&
      (currentPortfolio.balance || 0) < Number(quantity) * quote.price
    ) {
      setError("Insufficient balance to complete this purchase");
      if (onError) onError("Insufficient balance to complete this purchase");
      return;
    }

    if (orderType === "sell") {
      const { hasEnoughShares, quantity: availableQuantity } = findHolding(
        currentPortfolio,
        symbol
      );

      if (!hasEnoughShares) {
        setError(
          `You don't own enough shares of ${symbol}. Available: ${availableQuantity}`
        );
        if (onError)
          onError(
            `You don't own enough shares of ${symbol}. Available: ${availableQuantity}`
          );
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Submitting trade request:", {
        portfolioId: currentPortfolio.id,
        symbol,
        quantity: Number(quantity),
        orderType: "market", // Using market order type
        side: orderType,
        price: quote.price,
        notes: `${orderType.toUpperCase()} ${quantity} shares of ${symbol} at $${quote.price.toFixed(
          2
        )}`,
      });

      // Use fetch API to submit trade to server endpoint
      const response = await fetch("/api/trades/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          portfolioId: currentPortfolio.id,
          symbol,
          quantity: Number(quantity),
          orderType: "market", // Using market order type
          side: orderType,
          price: quote.price,
          notes: `${orderType.toUpperCase()} ${quantity} shares of ${symbol} at $${quote.price.toFixed(
            2
          )}`,
        }),
        credentials: "include", // Important for sending cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            "Failed to submit trade request"
        );
      }

      const result = await response.json();
      console.log("Trade response:", result);

      // Clear form
      setSymbol("");
      setQuantity("");
      setPreview(null);

      // Refetch portfolio to get updated data
      await refetchPortfolio();

      // Handle success
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Trade error:", err);
      setError(err.message || "Failed to process trade");
      if (onError) onError(err.message || "Failed to process trade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Place a Trade</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stock Symbol
          </label>
          <input
            type="text"
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            required
            placeholder="e.g. AAPL"
          />
          {quote && !quoteLoading && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Current Price:</span> $
              {quote.price.toFixed(2)}
            </div>
          )}
          {quoteLoading && (
            <div className="mt-2 text-sm text-gray-500">Loading price...</div>
          )}
          {quoteError && (
            <div className="mt-2 text-sm text-red-600">{quoteError}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
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
            loading ||
            quoteLoading ||
            !quote ||
            (preview && !preview.canAfford) ||
            portfolioLoading
          }
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {loading
            ? "Processing..."
            : portfolioLoading
            ? "Loading portfolio..."
            : `Place ${orderType.toUpperCase()} Order`}
        </button>
      </form>
    </div>
  );
}

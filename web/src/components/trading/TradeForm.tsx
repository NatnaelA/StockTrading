"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaSync, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { useStockData } from "@/hooks/useStockData";

interface TradeFormProps {
  onTrade?: (order: {
    symbol: string;
    side: "buy" | "sell";
    orderType: "market" | "limit";
    quantity: number;
    price?: number;
  }) => void;
}

export default function TradeForm({ onTrade }: TradeFormProps) {
  const { t } = useTranslation();
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get real-time stock data
  const {
    quote,
    loading: quoteLoading,
    error: quoteError,
    refetch,
  } = useStockData(symbol);

  // Update price field when market price changes
  useEffect(() => {
    if (quote && orderType === "limit") {
      setPrice(quote.price.toString());
    }
  }, [quote, orderType]);

  // Calculate total cost
  const calculateTotal = () => {
    if (!quote || !quantity) return null;
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) return null;

    const priceToUse =
      orderType === "limit" && price ? Number(price) : quote.price;
    return qty * priceToUse;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      if (!symbol) throw new Error("Symbol is required");
      if (!quantity || Number(quantity) <= 0)
        throw new Error("Invalid quantity");
      if (orderType === "limit" && (!price || Number(price) <= 0)) {
        throw new Error("Invalid price for limit order");
      }

      // Create order object
      const order = {
        symbol: symbol.toUpperCase(),
        side,
        orderType,
        quantity: Number(quantity),
        ...(orderType === "limit" && { price: Number(price) }),
      };

      // Call onTrade if provided, otherwise just log
      if (onTrade) {
        await onTrade(order);
      } else {
        console.log("Mock trade submitted:", order);
      }

      // Reset form
      setSymbol("");
      setQuantity("");
      setPrice("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit trade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">{t("trade.newOrder")}</h2>

      {/* Stock Quote Section */}
      {symbol && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">{symbol.toUpperCase()}</h3>
            <button
              onClick={refetch}
              disabled={quoteLoading}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaSync className={`${quoteLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {quoteError ? (
            <p className="text-red-600 text-sm">{quoteError}</p>
          ) : quote ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Price:</span>
                <span className="font-medium">${quote.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Change:</span>
                <span
                  className={`flex items-center ${
                    quote.change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {quote.change >= 0 ? (
                    <FaArrowUp className="mr-1" />
                  ) : (
                    <FaArrowDown className="mr-1" />
                  )}
                  ${Math.abs(quote.change).toFixed(2)} (
                  {quote.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Range:</span>
                <span>
                  ${quote.low.toFixed(2)} - ${quote.high.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Volume:</span>
                <span>{quote.volume.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="symbol"
            className="block text-sm font-medium text-gray-700"
          >
            {t("trade.symbol")}
          </label>
          <input
            type="text"
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="AAPL"
          />
        </div>

        <div>
          <label
            htmlFor="side"
            className="block text-sm font-medium text-gray-700"
          >
            {t("trade.side")}
          </label>
          <select
            id="side"
            value={side}
            onChange={(e) => setSide(e.target.value as "buy" | "sell")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="buy">{t("trade.buy")}</option>
            <option value="sell">{t("trade.sell")}</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="orderType"
            className="block text-sm font-medium text-gray-700"
          >
            {t("trade.orderType")}
          </label>
          <select
            id="orderType"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as "market" | "limit")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="market">{t("trade.market")}</option>
            <option value="limit">{t("trade.limit")}</option>
          </select>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700"
            >
              {t("trade.quantity")}
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              step="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {orderType === "limit" && (
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700"
              >
                {t("trade.price")}
              </label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          )}

          {/* Total Cost Display */}
          {quote && quantity && Number(quantity) > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Estimated Total:</span>
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900">
                    ${calculateTotal()?.toFixed(2)}
                  </span>
                  <div className="text-sm text-gray-500">
                    @ $
                    {(orderType === "limit" && price
                      ? Number(price)
                      : quote.price
                    ).toFixed(2)}{" "}
                    per share
                  </div>
                </div>
              </div>
              {side === "buy" && (
                <div className="mt-2 text-sm text-gray-500">
                  This amount will be deducted from your account balance
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || quoteLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading || quoteLoading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading || quoteLoading ? t("common.loading") : t("trade.submit")}
        </button>
      </form>
    </div>
  );
}

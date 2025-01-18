"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

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
            onChange={(e) => setSymbol(e.target.value)}
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

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? t("common.loading") : t("trade.submit")}
        </button>
      </form>
    </div>
  );
}

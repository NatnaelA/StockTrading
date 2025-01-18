"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaSpinner, FaInfoCircle } from "react-icons/fa";
import {
  marketDataService,
  MarketData,
  MarketIndicators,
} from "@/services/marketDataService";

interface TradeFormProps {
  onSubmit: (data: TradeFormData) => Promise<void>;
}

interface TradeFormData {
  symbol: string;
  quantity: number;
  type: "market" | "limit" | "stop";
  side: "buy" | "sell";
  price?: number;
  stopPrice?: number;
}

export default function TradeForm({ onSubmit }: TradeFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [indicators, setIndicators] = useState<MarketIndicators | null>(null);
  const [formData, setFormData] = useState<TradeFormData>({
    symbol: "",
    quantity: 0,
    type: "market",
    side: "buy",
  });

  useEffect(() => {
    const checkMarketStatus = async () => {
      try {
        const status = await marketDataService.getMarketStatus();
        if (!status.isOpen) {
          setWarning(`Market is ${status.status}. Trading may be restricted.`);
        } else {
          setWarning(null);
        }
      } catch (err) {
        console.error("Error checking market status:", err);
      }
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleSymbolChange = async (symbol: string) => {
    setFormData((prev) => ({ ...prev, symbol }));
    if (symbol.length >= 1) {
      try {
        setLoading(true);
        const [quote, marketIndicators] = await Promise.all([
          marketDataService.getQuote(symbol),
          marketDataService.getMarketIndicators(symbol),
        ]);

        setMarketData(quote);
        setIndicators(marketIndicators);
        setError(null);
      } catch (err) {
        setError("Invalid symbol or unable to fetch data");
        setMarketData(null);
        setIndicators(null);
      } finally {
        setLoading(false);
      }
    } else {
      setMarketData(null);
      setIndicators(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const validation = await marketDataService.validateTrade(
        formData.symbol,
        formData.quantity,
        formData.side,
        formData.type,
        formData.price
      );

      if (!validation.isValid) {
        setError(validation.reason || "Trade validation failed");
        return;
      }

      if (validation.reason) {
        setWarning(validation.reason);
      }

      await onSubmit(formData);
    } catch (err) {
      setError("Failed to submit trade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t("trade.symbol")}
        </label>
        <input
          type="text"
          value={formData.symbol}
          onChange={(e) => handleSymbolChange(e.target.value.toUpperCase())}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
        {marketData && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-500">
              Current Price: ${marketData.latestPrice.toFixed(2)}
              <span
                className={`ml-2 ${
                  marketData.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {marketData.change >= 0 ? "+" : ""}
                {marketData.changePercent.toFixed(2)}%
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Volume: {marketData.volume.toLocaleString()}
            </p>
          </div>
        )}
        {indicators && (
          <div className="mt-2 space-y-1 text-sm text-gray-500">
            <p>RSI: {indicators.rsi.toFixed(2)}</p>
            <p>SMA: ${indicators.sma.toFixed(2)}</p>
            <p>EMA: ${indicators.ema.toFixed(2)}</p>
            <p>MACD: {indicators.macd.macd.toFixed(2)}</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t("trade.type")}
        </label>
        <select
          value={formData.type}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              type: e.target.value as "market" | "limit" | "stop",
            }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="market">{t("trade.type.market")}</option>
          <option value="limit">{t("trade.type.limit")}</option>
          <option value="stop">{t("trade.type.stop")}</option>
        </select>
      </div>

      {formData.type === "limit" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("trade.limitPrice")}
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                price: parseFloat(e.target.value),
              }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
      )}

      {formData.type === "stop" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("trade.stopPrice")}
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.stopPrice || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                stopPrice: parseFloat(e.target.value),
              }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t("trade.quantity")}
        </label>
        <input
          type="number"
          min="1"
          value={formData.quantity || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              quantity: parseInt(e.target.value),
            }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t("trade.side")}
        </label>
        <select
          value={formData.side}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              side: e.target.value as "buy" | "sell",
            }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="buy">{t("trade.side.buy")}</option>
          <option value="sell">{t("trade.side.sell")}</option>
        </select>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <FaInfoCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {warning && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <FaInfoCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{warning}</p>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
      >
        {loading ? (
          <FaSpinner className="h-5 w-5 animate-spin" />
        ) : (
          t("trade.submit")
        )}
      </button>
    </form>
  );
}

"use client";

import { useTranslation } from "react-i18next";
import { Portfolio } from "@/types/trading";

interface PortfolioSummaryProps {
  portfolio: Portfolio;
}

export default function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Value */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">
            {t("portfolio.totalValue")}
          </h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: portfolio.currency,
            }).format(portfolio.totalValue)}
          </p>
        </div>

        {/* Day Change */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">
            {t("portfolio.dayChange")}
          </h3>
          <div className="mt-1 flex items-baseline">
            <p
              className={`text-2xl font-semibold ${
                portfolio.dayChange >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: portfolio.currency,
                signDisplay: "always",
              }).format(portfolio.dayChange)}
            </p>
            <p
              className={`ml-2 text-sm ${
                portfolio.dayChangePercentage >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              ({portfolio.dayChangePercentage >= 0 ? "+" : ""}
              {portfolio.dayChangePercentage.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* Available Balance */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">
            {t("portfolio.availableBalance")}
          </h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: portfolio.currency,
            }).format(portfolio.balance)}
          </p>
        </div>
      </div>
    </div>
  );
}

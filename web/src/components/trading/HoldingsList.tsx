"use client";

import { useTranslation } from "react-i18next";

interface Holding {
  symbol: string;
  quantity: number;
  currentPrice: number;
  previousClose: number;
}

interface HoldingsListProps {
  holdings: Holding[];
}

export default function HoldingsList({ holdings }: HoldingsListProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("portfolio.holdings")}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t("portfolio.symbol")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t("portfolio.quantity")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t("portfolio.currentPrice")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t("portfolio.marketValue")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t("portfolio.dayChange")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {holdings.map((holding) => {
              const marketValue = holding.quantity * holding.currentPrice;
              const dayChange =
                holding.quantity *
                (holding.currentPrice - holding.previousClose);
              const dayChangePercent =
                ((holding.currentPrice - holding.previousClose) /
                  holding.previousClose) *
                100;

              return (
                <tr key={holding.symbol}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {holding.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {holding.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(holding.currentPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(marketValue)}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                      dayChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <div>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        signDisplay: "always",
                      }).format(dayChange)}
                    </div>
                    <div className="text-xs">
                      {dayChangePercent >= 0 ? "+" : ""}
                      {dayChangePercent.toFixed(2)}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

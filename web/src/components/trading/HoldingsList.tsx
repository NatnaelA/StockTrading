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

export default function HoldingsList({ holdings = [] }: HoldingsListProps) {
  const { t } = useTranslation();

  if (!Array.isArray(holdings)) {
    console.warn("Holdings is not an array:", holdings);
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t("portfolio.holdings")}
        </h2>
        <p className="text-gray-500 text-center py-4">No holdings available</p>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t("portfolio.holdings")}
        </h2>
        <p className="text-gray-500 text-center py-4">No holdings available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
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
                Symbol
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Shares
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Price
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Market Value
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Day Change
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
                holding.previousClose > 0
                  ? ((holding.currentPrice - holding.previousClose) /
                      holding.previousClose) *
                    100
                  : 0;

              return (
                <tr key={holding.symbol}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {holding.symbol}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">
                      {holding.quantity.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">
                      ${holding.currentPrice.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">
                      $
                      {marketValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`${
                        dayChange >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <span>
                        {dayChange >= 0 ? "+" : ""}$
                        {Math.abs(dayChange).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-sm ml-1">
                        ({dayChange >= 0 ? "+" : ""}
                        {dayChangePercent.toFixed(2)}%)
                      </span>
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

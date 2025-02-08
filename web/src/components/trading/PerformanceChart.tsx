"use client";

import { useTranslation } from "react-i18next";
import { PerformanceData, TimeRange } from "@/types/trading";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PerformanceChartProps {
  data: PerformanceData[];
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

const timeRanges: TimeRange[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

export default function PerformanceChart({
  data,
  selectedRange,
  onRangeChange,
}: PerformanceChartProps) {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("portfolio.performance")}
          </h2>
          <div className="flex space-x-2">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => onRangeChange(range)}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          {t("portfolio.noPerformanceData")}
        </div>
      </div>
    );
  }

  const formatValue = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t("portfolio.performance")}
          </h2>
          <p className="text-sm text-gray-400">
            {t("portfolio.dateRange", {
              start: formatDate(data[0].timestamp),
              end: formatDate(data[data.length - 1].timestamp),
            })}
          </p>
        </div>
        <div className="flex space-x-2">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
              className={`px-3 py-1 text-sm rounded-md ${
                selectedRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDate}
              stroke="#9CA3AF"
            />
            <YAxis tickFormatter={formatValue} stroke="#9CA3AF" width={80} />
            <Tooltip
              formatter={(value: number) => [formatValue(value), "Value"]}
              labelFormatter={formatDate}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563EB"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import { useTranslation } from "react-i18next";
import { TimeRange } from "@/types/trading";

interface PerformanceChartProps {
  data: { timestamp: number; value: number }[];
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

  // For now, we'll just show a placeholder since we don't want to add a heavy charting library
  // In a real app, you would use something like Chart.js, Recharts, or a similar library
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("portfolio.performance")}
        </h2>
        <div className="flex space-x-2">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                selectedRange === range
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500 mb-2">
            {t("portfolio.chartPlaceholder")}
          </p>
          <p className="text-sm text-gray-400">
            {t("portfolio.dataPoints", { count: data.length })}
          </p>
          <p className="text-sm text-gray-400">
            {t("portfolio.dateRange", {
              start: new Date(data[0].timestamp).toLocaleDateString(),
              end: new Date(
                data[data.length - 1].timestamp
              ).toLocaleDateString(),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

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
  CartesianGrid,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { useMemo } from "react";

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

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!data || data.length < 2) {
      return { change: 0, percentChange: 0, isPositive: false };
    }

    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = lastValue - firstValue;
    const percentChange = (change / firstValue) * 100;

    return {
      change,
      percentChange,
      isPositive: change >= 0,
    };
  }, [data]);

  // Format date based on selected time range
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);

    switch (selectedRange) {
      case "1D":
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "1W":
        return date.toLocaleDateString([], { weekday: "short" });
      case "1M":
        return date.toLocaleDateString([], { day: "numeric", month: "short" });
      case "3M":
        return date.toLocaleDateString([], { day: "numeric", month: "short" });
      case "1Y":
        return date.toLocaleDateString([], { month: "short", year: "2-digit" });
      case "ALL":
        return date.toLocaleDateString([], { month: "short", year: "numeric" });
      default:
        return date.toLocaleDateString();
    }
  };

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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  // Find min and max values for better chart scaling
  const minValue = Math.min(...data.map((item) => item.value)) * 0.99; // 1% padding
  const maxValue = Math.max(...data.map((item) => item.value)) * 1.01; // 1% padding

  // Determine chart color based on performance
  const chartColor = performanceMetrics.isPositive ? "#10B981" : "#EF4444";

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t("portfolio.performance")}
          </h2>
          <div className="flex items-center mt-1">
            <span
              className={`text-lg font-bold ${
                performanceMetrics.isPositive
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatValue(performanceMetrics.change)}
            </span>
            <span
              className={`ml-2 text-sm ${
                performanceMetrics.isPositive
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {performanceMetrics.isPositive ? "+" : ""}
              {performanceMetrics.percentChange.toFixed(2)}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {formatDate(data[0].timestamp)} -{" "}
            {formatDate(data[data.length - 1].timestamp)}
          </p>
        </div>
        <div className="flex space-x-1">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
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
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDate}
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis
              tickFormatter={formatValue}
              stroke="#9CA3AF"
              width={80}
              domain={[minValue, maxValue]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => [formatValue(value), "Value"]}
              labelFormatter={(timestamp) => formatDate(timestamp)}
              contentStyle={{
                borderRadius: "4px",
                border: "none",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                fontSize: "12px",
              }}
            />
            <ReferenceLine
              y={data[0].value}
              stroke="#9CA3AF"
              strokeDasharray="3 3"
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  TimeRange,
  Portfolio,
  TradeOrder,
  TradeDocument,
} from "@/types/trading";
import PortfolioSummary from "@/components/trading/PortfolioSummary";
import PerformanceChart from "@/components/trading/PerformanceChart";
import HoldingsList from "@/components/trading/HoldingsList";
import RecentTrades from "@/components/trading/RecentTrades";
import TradeForm from "@/components/trading/TradeForm";
import DocumentsList from "@/components/trading/DocumentsList";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Mock data
const mockPortfolio: Portfolio = {
  id: "mock-portfolio",
  userId: "mock-user-id",
  name: "My Portfolio",
  balance: 100000,
  currency: "USD",
  holdings: [
    {
      symbol: "AAPL",
      quantity: 100,
      currentPrice: 180.5,
      previousClose: 178.2,
    },
    {
      symbol: "GOOGL",
      quantity: 50,
      currentPrice: 2750.8,
      previousClose: 2740.5,
    },
    { symbol: "MSFT", quantity: 75, currentPrice: 310.2, previousClose: 308.8 },
  ],
  totalValue: 250000,
  dayChange: 5000,
  dayChangePercentage: 2.04,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockPerformanceData = [
  { timestamp: Date.now() - 86400000 * 7, value: 100000 },
  { timestamp: Date.now() - 86400000 * 6, value: 102000 },
  { timestamp: Date.now() - 86400000 * 5, value: 101500 },
  { timestamp: Date.now() - 86400000 * 4, value: 103000 },
  { timestamp: Date.now() - 86400000 * 3, value: 105000 },
  { timestamp: Date.now() - 86400000 * 2, value: 104500 },
  { timestamp: Date.now() - 86400000, value: 106000 },
  { timestamp: Date.now(), value: 107000 },
];

const mockTrades: TradeOrder[] = [
  {
    id: "1",
    symbol: "AAPL",
    side: "buy",
    orderType: "market",
    quantity: 10,
    price: 180.5,
    status: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    symbol: "GOOGL",
    side: "sell",
    orderType: "limit",
    quantity: 5,
    price: 2750.8,
    status: "pending",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const mockDocuments: TradeDocument[] = [
  {
    id: "1",
    type: "statement",
    date: new Date().toISOString(),
    description: "Monthly Account Statement - January 2024",
    url: "#",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    type: "tax",
    date: new Date(Date.now() - 86400000 * 30).toISOString(),
    description: "Tax Document - 2023",
    url: "#",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];

interface User {
  id: string;
  email: string;
  name: string;
}

export default function TraderDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("1W");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for user in localStorage
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("portfolio.summary")}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              {t("auth.signOut")}
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <PortfolioSummary portfolio={mockPortfolio} />
            </div>
            <div className="mb-8">
              <PerformanceChart
                data={mockPerformanceData}
                selectedRange={selectedTimeRange}
                onRangeChange={setSelectedTimeRange}
              />
            </div>
            <div className="mb-8">
              <HoldingsList holdings={mockPortfolio.holdings} />
            </div>
            <div>
              <RecentTrades trades={mockTrades} />
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div className="mb-8">
              <TradeForm
                onTrade={(order) => {
                  console.log("Mock trade submitted:", order);
                }}
              />
            </div>
            <div>
              <DocumentsList documents={mockDocuments} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

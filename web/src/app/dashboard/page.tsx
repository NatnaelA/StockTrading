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
import DepositForm from "@/components/DepositForm";
import WithdrawalForm from "@/components/WithdrawalForm";
import { FaTimes } from "react-icons/fa";

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
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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
    router.push("/");
  };

  const handleTransactionSuccess = (type: "deposit" | "withdraw") => {
    setTransactionStatus({
      type: "success",
      message: `${type === "deposit" ? "Deposit" : "Withdrawal"} successful!`,
    });
    setShowDepositModal(false);
    setShowWithdrawModal(false);
    setTimeout(() => setTransactionStatus(null), 5000);
  };

  const handleTransactionError = (error: string) => {
    setTransactionStatus({
      type: "error",
      message: error,
    });
    setTimeout(() => setTransactionStatus(null), 5000);
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
            {/* Account Management Section */}
            <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Account Management
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Available Balance
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${mockPortfolio.balance.toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowDepositModal(true)}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="w-full py-2 px-4 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Withdraw
                  </button>
                </div>
                {transactionStatus && (
                  <div
                    className={`p-3 rounded-lg ${
                      transactionStatus.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {transactionStatus.message}
                  </div>
                )}
              </div>
            </div>

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

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Deposit Funds
              </h2>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <DepositForm
              portfolioId={mockPortfolio.id}
              onSuccess={() => handleTransactionSuccess("deposit")}
              onError={handleTransactionError}
            />
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Withdraw Funds
              </h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <WithdrawalForm
              portfolioId={mockPortfolio.id}
              availableBalance={mockPortfolio.balance}
              onSuccess={() => handleTransactionSuccess("withdraw")}
              onError={handleTransactionError}
            />
          </div>
        </div>
      )}
    </div>
  );
}

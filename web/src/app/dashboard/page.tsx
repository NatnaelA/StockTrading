"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { TimeRange } from "@/types/trading";
import { auth } from "@/lib/firebase";
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

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { loading: authLoading } = useProtectedRoute();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    portfolio,
    recentTrades,
    performanceData,
    loading: portfolioLoading,
    error,
    selectedTimeRange,
    updateTimeRange,
  } = usePortfolio(user?.id || "");

  const loading = authLoading || portfolioLoading;

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
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

  // Show loading state while authentication or portfolio data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="container mx-auto px-4 py-4">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
                <div className="space-y-4">
                  <div className="h-8 w-1/3 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-24 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
              <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
                <div className="space-y-4">
                  <div className="h-8 w-1/4 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-48 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            </div>
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="space-y-4">
                  <div className="h-8 w-1/2 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Portfolio error:", error);
    // Don't show error to user, just log it and continue with empty portfolio
  }

  // Initialize empty portfolio if none exists
  const portfolioData = portfolio || {
    id: user?.id || "",
    userId: user?.id || "",
    name: "My Portfolio",
    balance: 0,
    currency: "USD",
    holdings: [],
    totalValue: 0,
    dayChange: 0,
    dayChangePercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("portfolio.summary")}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={handleSignOut}
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
              <PortfolioSummary portfolio={portfolioData} />
            </div>
            <div className="mb-8">
              <PerformanceChart
                data={performanceData}
                selectedRange={selectedTimeRange}
                onRangeChange={updateTimeRange}
              />
            </div>
            <div className="mb-8">
              <HoldingsList holdings={portfolioData.holdings} />
            </div>
            <div>
              <RecentTrades />
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
                    ${portfolioData.balance.toLocaleString()}
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
                onSuccess={() => {
                  // Portfolio will automatically update through the usePortfolio hook
                }}
                onError={(error) => {
                  setTransactionStatus({
                    type: "error",
                    message: error,
                  });
                }}
              />
            </div>
            <div>
              <DocumentsList userId={user?.id || ""} />
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
              portfolioId={portfolioData.id}
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
              portfolioId={portfolioData.id}
              availableBalance={portfolioData.balance}
              onSuccess={() => handleTransactionSuccess("withdraw")}
              onError={handleTransactionError}
            />
          </div>
        </div>
      )}
    </div>
  );
}

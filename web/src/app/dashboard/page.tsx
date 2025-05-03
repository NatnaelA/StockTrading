"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useServerPortfolio } from "@/hooks/useServerPortfolio";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { TimeRange } from "@/types/trading";
import UserProfile from "@/components/auth/UserProfile";
import PortfolioSummary from "@/components/trading/PortfolioSummary";
import PerformanceChart from "@/components/trading/PerformanceChart";
import HoldingsList from "@/components/trading/HoldingsList";
import RecentTrades from "@/components/trading/RecentTrades";
import TradeForm from "@/components/trading/TradeForm";
import DocumentsList from "@/components/trading/DocumentsList";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import DepositForm from "@/components/DepositForm";
import WithdrawalForm from "@/components/WithdrawalForm";
import CapturePortfolioHistory from "@/components/trading/CapturePortfolioHistory";
import { FaTimes } from "react-icons/fa";

console.log("--- DashboardPage File Loaded ---"); // Keep this top-level log

export default function DashboardPage() {
  console.log("--- DashboardPage Component Rendering --- L1 ---"); // Add log
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuth();
  const {
    portfolio,
    performanceData,
    loading: portfolioLoading,
    error: portfolioError,
    selectedTimeRange,
    updateTimeRange,
    refetch,
    profile,
  } = useServerPortfolio(user?.id);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [creationAttempts, setCreationAttempts] = useState(0);
  const [showManualCreateButton, setShowManualCreateButton] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to redirect if authenticated user has NOT completed their profile
  useEffect(() => {
    console.log("[Dashboard Redirect Check]", {
      authLoading,
      userId: user?.id,
      portfolioLoading,
      hasPortfolio: !!portfolio,
      profileLoading: portfolioLoading, // Profile is loaded when portfolio is loaded
      profileCompleted: profile?.profile_completed,
    });

    // Redirect ONLY if user is loaded, data fetching is complete, AND profile is marked as incomplete
    if (!authLoading && user && !portfolioLoading) {
      // Check loading state
      if (profile && profile.profile_completed === false) {
        console.log(
          "[DashboardPage] Profile not complete, redirecting to /complete-profile"
        );
        router.push("/complete-profile");
      } else if (!profile) {
        // This case might indicate an error fetching the profile itself
        console.warn(
          "[Dashboard Redirect Check] Profile data missing after loading."
        );
        // Maybe redirect to an error page or show an error message?
        // For now, let's prevent redirect loop if profile is missing unexpectedly.
      } else {
        // Profile is loaded and complete (or portfolio exists - though profile check is better)
        console.log(
          "[Dashboard Redirect Check] Profile complete, NO redirect."
        );
      }
    } else {
      console.log(
        "[Dashboard Redirect Check] Conditions not met (still loading or no user)."
      );
    }
    // Depend on profile object as well
  }, [user, authLoading, portfolio, portfolioLoading, router, profile]);

  // Manual portfolio creation function - kept in case it's needed for error recovery
  // or if the API route returns a status indicating manual creation is needed.
  const handleManualCreate = async () => {
    // Reset attempt counter and hide button
    setCreationAttempts(0);
    setShowManualCreateButton(false);
    setCreatingPortfolio(true);
    setError(null); // Clear previous errors

    try {
      console.log(
        "Manually attempting to create portfolio for user:",
        user?.id
      );
      // Call the portfolio creation API
      const response = await fetch("/api/portfolios/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "My Portfolio", // Or allow user input?
          currency: "USD",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create portfolio (${response.status}): ${
            errorData.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      console.log("Portfolio created manually:", data);

      // Refresh the portfolio data
      refetch();

      setTransactionStatus({
        type: "success",
        message: "Portfolio created successfully!",
      });
      setTimeout(() => setTransactionStatus(null), 5000);
    } catch (error) {
      console.error("Error manually creating portfolio:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create portfolio. Please try again."
      );
      // Optionally show the manual button again after a delay or failed attempt
      setShowManualCreateButton(true);
    } finally {
      setCreatingPortfolio(false);
    }
  };

  const loading = portfolioLoading || authLoading || creatingPortfolio;

  const handleTransactionSuccess = (type: "deposit" | "withdraw") => {
    setTransactionStatus({
      type: "success",
      message: `${type === "deposit" ? "Deposit" : "Withdrawal"} successful!`,
    });

    // Close the modal
    if (type === "deposit") setShowDepositModal(false);
    else setShowWithdrawModal(false);

    // Refresh portfolio data
    refetch();

    // Clear the message after 5 seconds
    setTimeout(() => {
      setTransactionStatus(null);
    }, 5000);
  };

  const handleTransactionError = (error: string) => {
    setTransactionStatus({
      type: "error",
      message: error,
    });

    // Clear the message after 5 seconds
    setTimeout(() => {
      setTransactionStatus(null);
    }, 5000);
  };

  console.log("--- DashboardPage Component Rendering --- L2 ---"); // Add log

  // Handle the case where we are redirecting based on profile completion
  if (
    !authLoading &&
    user &&
    !portfolioLoading &&
    profile &&
    profile.profile_completed === false
  ) {
    console.log(
      "--- DashboardPage Component Rendering --- Redirecting Block (Profile Incomplete) ---"
    );
    // Render minimal loading state while redirect happens
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 text-center">
          <p>{t("redirecting.to.profile")}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    console.log("--- DashboardPage Component Rendering --- Loading Block ---");
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 text-center">
          <p>{t("loading")}</p>
        </div>
      </div>
    );
  }

  console.log(
    "--- DashboardPage Component Rendering --- L3 --- Ready to return JSX ---"
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {t("portfolio.summary")}
            </h1>
            <div className="flex items-center space-x-4">
              <UserProfile />
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Portfolio Summary and Charts */}
          {portfolio && !loading && (
            <>
              <CapturePortfolioHistory portfolioId={portfolio.id} />

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left Column: Summary & Holdings */}
                <div className="lg:col-span-2 space-y-8">
                  <PortfolioSummary portfolio={portfolio} />
                  <PerformanceChart
                    data={performanceData}
                    selectedRange={selectedTimeRange as TimeRange}
                    onRangeChange={updateTimeRange}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <HoldingsList holdings={portfolio.holdings || []} />
                    <RecentTrades />
                  </div>
                  <DocumentsList userId={user?.id || ""} />
                </div>

                {/* Right Column: Trade Form */}
                <div>
                  <TradeForm />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Deposit Modal */}
        {showDepositModal && portfolio && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
              <button
                className="absolute top-4 right-4"
                onClick={() => setShowDepositModal(false)}
              >
                <FaTimes />
              </button>
              <h2 className="text-xl font-bold mb-4">{t("deposit.title")}</h2>
              <DepositForm
                onSuccess={() => handleTransactionSuccess("deposit")}
                onError={handleTransactionError}
                portfolioId={portfolio.id}
              />
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && portfolio && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
              <button
                className="absolute top-4 right-4"
                onClick={() => setShowWithdrawModal(false)}
              >
                <FaTimes />
              </button>
              <h2 className="text-xl font-bold mb-4">
                {t("withdrawal.title")}
              </h2>
              <WithdrawalForm
                onSuccess={() => handleTransactionSuccess("withdraw")}
                onError={handleTransactionError}
                portfolioId={portfolio.id}
                availableBalance={portfolio.balance}
              />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

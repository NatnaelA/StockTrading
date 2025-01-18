"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentData } from "firebase/firestore";
import PageHeader from "@/components/PageHeader";
import PortfolioBalance from "@/components/PortfolioBalance";
import { usePortfolioListener } from "@/hooks/useFirestoreListener";
import { notificationService } from "@/services/notifications";

interface Portfolio {
  id: string;
  name: string;
  ownerId: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function PortfolioPage({
  params,
}: {
  params: { portfolioId: string };
}) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Request notification permission and setup FCM
  useEffect(() => {
    const setupNotifications = async () => {
      const hasPermission = await notificationService.requestPermission();
      if (hasPermission) {
        const token = await notificationService.getFCMToken();
        if (token) {
          // Setup message listener
          const unsubscribe = notificationService.setupMessageListener(
            (payload) => {
              console.log("Received notification:", payload);
              // Handle notification payload as needed
            }
          );

          return () => unsubscribe();
        }
      }
    };

    setupNotifications();
  }, []);

  // Use Firestore listener for real-time updates
  usePortfolioListener(
    params.portfolioId,
    (data: DocumentData) => {
      setPortfolio({
        id: data.id,
        name: data.name,
        ownerId: data.ownerId,
        balance: data.balance,
        currency: data.currency,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
      setLoading(false);
    },
    [params.portfolioId]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="h-48 bg-gray-200 rounded w-full max-w-md"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Portfolio not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={portfolio.name}
        description="Manage your portfolio balance and view transaction history"
      />

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <PortfolioBalance portfolioId={params.portfolioId} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() =>
                router.push(`/trade?portfolioId=${params.portfolioId}`)
              }
              className="p-4 text-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Place Trade
            </button>
            <button
              onClick={() =>
                router.push(`/transactions?portfolioId=${params.portfolioId}`)
              }
              className="p-4 text-center bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              View Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

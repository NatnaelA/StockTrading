"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { useEffect } from "react";

const getDateFromTimestamp = (timestamp: string | Timestamp): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

export default function RecentTrades() {
  const { user } = useAuth();
  const { transactions, loading, error } = useTransactions(user?.id || "");

  // Add debug logging
  useEffect(() => {
    console.log("RecentTrades component:", {
      userId: user?.id,
      transactionsCount: transactions?.length,
      loading,
      error,
    });
  }, [user?.id, transactions, loading, error]);

  if (!user?.id) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Trades
        </h2>
        <p className="text-gray-500 text-center py-4">
          Please log in to view your trades
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Trades
        </h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Trades
        </h2>
        <div className="p-4 text-red-700 bg-red-50 rounded-lg">
          <p>Unable to load recent trades</p>
          <small className="text-red-600">Please try refreshing the page</small>
        </div>
      </div>
    );
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = getDateFromTimestamp(a.createdAt);
    const dateB = getDateFromTimestamp(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Recent Trades
      </h2>

      {!sortedTransactions || sortedTransactions.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No recent trades</p>
      ) : (
        <div className="space-y-4">
          {sortedTransactions.map((trade) => {
            if (
              !trade.ticker ||
              !trade.type ||
              !trade.quantity ||
              !trade.price ||
              !trade.createdAt
            ) {
              return null;
            }

            const tradeDate = getDateFromTimestamp(trade.createdAt);

            return (
              <div
                key={trade.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{trade.ticker}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        trade.type.toLowerCase() === "buy"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {trade.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(tradeDate, "MMM d, yyyy h:mm a")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {trade.quantity} shares @ ${Number(trade.price).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Total: ${(trade.quantity * Number(trade.price)).toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

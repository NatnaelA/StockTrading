"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DocumentData } from "firebase/firestore";
import styled from "styled-components";
import { FaSpinner, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import PageHeader from "@/components/PageHeader";
import { useTransactionsListener } from "@/hooks/useFirestoreListener";

const StyledSpinner = styled(FaSpinner)`
  animation: spin 1s linear infinite;
  color: #3b82f6;
`;

const StyledCheckCircle = styled(FaCheckCircle)`
  color: #10b981;
`;

const StyledTimesCircle = styled(FaTimesCircle)`
  color: #ef4444;
`;

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const portfolioId = searchParams.get("portfolioId");

  // Use Firestore listener for real-time updates
  useTransactionsListener(
    portfolioId || "",
    (data: DocumentData) => {
      if (Array.isArray(data)) {
        setTransactions(
          data.map((t) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            currency: t.currency,
            status: t.status,
            error: t.error,
            createdAt: t.createdAt?.toDate() || new Date(),
            updatedAt: t.updatedAt?.toDate() || new Date(),
          }))
        );
      }
      setLoading(false);
    },
    [portfolioId]
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getStatusIcon = (status: Transaction["status"]) => {
    const iconProps = { size: 20 };
    switch (status) {
      case "completed":
        return <StyledCheckCircle {...iconProps} />;
      case "failed":
        return <StyledTimesCircle {...iconProps} />;
      case "pending":
        return <StyledSpinner {...iconProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <StyledSpinner size={32} />
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

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Transaction History"
        description="View your deposit and withdrawal history"
      />

      <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize">{transaction.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatAmount(transaction.amount, transaction.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(transaction.status)}
                      <span
                        className={`capitalize ${
                          transaction.status === "completed"
                            ? "text-green-600"
                            : transaction.status === "failed"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    {transaction.error && (
                      <p className="text-sm text-red-500 mt-1">
                        {transaction.error}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

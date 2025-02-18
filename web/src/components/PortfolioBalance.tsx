"use client";

import { useState, useEffect } from "react";
import { DocumentData } from "firebase/firestore";
import styled from "styled-components";
import { FaWallet, FaArrowUp, FaArrowDown, FaTimes } from "react-icons/fa";
import { usePortfolioListener } from "@/hooks/useFirestoreListener";
import DepositForm from "./DepositForm";
import WithdrawalForm from "./WithdrawalForm";

const BalanceCard = styled.div`
  background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
  border-radius: 1rem;
  padding: 2rem;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const BalanceAmount = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  margin: 1rem 0;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  &:focus {
    outline: none;
    ring: 2px;
    ring-offset: 2px;
    ring-white;
  }
`;

interface PortfolioBalanceProps {
  portfolioId: string;
}

export default function PortfolioBalance({
  portfolioId,
}: PortfolioBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Use Firestore listener for real-time updates
  usePortfolioListener(
    portfolioId,
    (data: DocumentData) => {
      setBalance(data.balance || 0);
      setLoading(false);
    },
    [portfolioId]
  );

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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

  if (loading) {
    return (
      <BalanceCard>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </BalanceCard>
    );
  }

  if (error) {
    return (
      <BalanceCard>
        <p className="text-red-300 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
          }}
          className="text-white underline hover:no-underline"
        >
          Retry
        </button>
      </BalanceCard>
    );
  }

  return (
    <>
      <BalanceCard>
        <div className="flex items-center gap-2 text-gray-300">
          <FaWallet />
          <span>Available Balance</span>
        </div>
        <BalanceAmount>
          {balance !== null ? formatBalance(balance) : "—"}
        </BalanceAmount>
        <div className="flex gap-4 mt-4">
          <ActionButton onClick={() => setShowDepositModal(true)}>
            <FaArrowDown />
            <span>Deposit</span>
          </ActionButton>
          <ActionButton onClick={() => setShowWithdrawModal(true)}>
            <FaArrowUp />
            <span>Withdraw</span>
          </ActionButton>
        </div>
        {transactionStatus && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              transactionStatus.type === "success"
                ? "bg-green-500/20 text-green-100"
                : "bg-red-500/20 text-red-100"
            }`}
          >
            {transactionStatus.message}
          </div>
        )}
      </BalanceCard>

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
              portfolioId={portfolioId}
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
              portfolioId={portfolioId}
              availableBalance={balance || 0}
              onSuccess={() => handleTransactionSuccess("withdraw")}
              onError={handleTransactionError}
            />
          </div>
        </div>
      )}
    </>
  );
}

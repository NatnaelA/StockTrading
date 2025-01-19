import { useState, useEffect } from 'react';

interface TransactionResult {
  success: boolean;
  error?: string;
  transactionId?: string;
  sessionId?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

export function useTransactions() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const createDeposit = async (
    portfolioId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<TransactionResult> => {
    // Check user in localStorage instead of Firebase
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolioId,
          amount,
          currency,
          userId: JSON.parse(storedUser).id, // Include user ID from localStorage
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create deposit');
      }

      return {
        success: true,
        transactionId: data.transactionId,
        sessionId: data.sessionId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create deposit',
      };
    } finally {
      setLoading(false);
    }
  };

  const createWithdrawal = async (
    portfolioId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<TransactionResult> => {
    // Check user in localStorage instead of Firebase
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolioId,
          amount,
          currency,
          userId: JSON.parse(storedUser).id, // Include user ID from localStorage
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create withdrawal');
      }

      return {
        success: true,
        transactionId: data.transactionId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create withdrawal',
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createDeposit,
    createWithdrawal,
  };
} 
"use client";

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { StockTransaction } from '@/types/trading';

/**
 * Process date values from API to ensure consistent format
 */
const processApiTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  return new Date();
};

/**
 * Hook for fetching transactions from the server API
 */
export function useServerTransactions(userId: string | undefined, portfolioId?: string) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      console.log('No userId provided to useServerTransactions hook');
      setLoading(false);
      setTransactions([]);
      return;
    }

    let isMounted = true;
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build the API URL with query parameters
        let url = `/api/transactions/recent`;
        const params = new URLSearchParams();
        
        if (portfolioId) {
          params.append('portfolioId', portfolioId);
        }
        
        const fullUrl = `${url}?${params.toString()}`;
        console.log(`Fetching transactions from: ${fullUrl}`);
        
        // Call the server API
        const response = await fetch(fullUrl, {
          credentials: 'include', // Important for sending cookies
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.error('Transaction API response not OK:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          
          try {
            // Try to parse the error as JSON
            const errorData = JSON.parse(errorText);
            throw new Error(`API error: ${response.status} ${errorData.message || response.statusText}`);
          } catch (e) {
            // If parsing fails, use the status text
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        console.log(`Retrieved ${data.transactions?.length || 0} transactions`, data);
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch transactions');
        }
        
        // Process the transactions
        const formattedTransactions: StockTransaction[] = (data.transactions || []).map((item: any) => ({
          id: item.id,
          userId: item.user_id || item.userId,
          ticker: item.ticker || item.symbol || item.stock_symbol,
          quantity: Number(item.quantity || 0),
          price: Number(item.price || 0),
          type: item.type || '',
          status: item.status || 'completed',
          date: processApiTimestamp(item.date),
        }));
        
        if (isMounted) {
          setTransactions(formattedTransactions);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
          setLoading(false);
        }
      }
    };
    
    fetchTransactions();
    
    return () => {
      isMounted = false;
    };
  }, [userId, portfolioId]);

  return { transactions, loading, error };
} 
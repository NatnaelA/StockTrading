"use client";

import { useState, useEffect } from 'react';
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Portfolio,
  TradeOrder,
  PerformanceData,
  TimeRange,
} from '@/types/trading';

export function usePortfolio(userId: string) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [recentTrades, setRecentTrades] = useState<TradeOrder[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1D');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to portfolio updates
    const portfolioUnsubscribe = onSnapshot(
      doc(db, 'portfolios', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          setPortfolio({
            id: snapshot.id,
            ...snapshot.data(),
          } as Portfolio);
        } else {
          setPortfolio(null);
        }
      },
      (err) => {
        setError(err as Error);
      }
    );

    // Subscribe to recent trades
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tradesUnsubscribe = onSnapshot(
      query(
        collection(db, 'trades'),
        where('userId', '==', userId),
        where('createdAt', '>=', thirtyDaysAgo.toISOString()),
        orderBy('createdAt', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        const trades = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as TradeOrder)
        );
        setRecentTrades(trades);
      },
      (err) => {
        setError(err as Error);
      }
    );

    // Subscribe to performance data
    const performanceUnsubscribe = onSnapshot(
      collection(db, `portfolios/${userId}/performance/${selectedTimeRange}/data`),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          timestamp: parseInt(doc.id, 10),
          value: doc.data().value,
        })) as PerformanceData[];
        setPerformanceData(data);
      },
      (err) => {
        setError(err as Error);
      }
    );

    setLoading(false);

    return () => {
      portfolioUnsubscribe();
      tradesUnsubscribe();
      performanceUnsubscribe();
    };
  }, [userId, selectedTimeRange]);

  const updateTimeRange = (range: TimeRange) => {
    setSelectedTimeRange(range);
  };

  return {
    portfolio,
    recentTrades,
    performanceData,
    loading,
    error,
    selectedTimeRange,
    updateTimeRange,
  };
} 
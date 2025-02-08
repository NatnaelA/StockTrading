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
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Portfolio,
  TradeOrder,
  PerformanceData,
  TimeRange,
} from '@/types/trading';

interface PortfolioHolding {
  quantity: number;
  averagePrice: number;
  lastUpdated: Timestamp;
}

interface StockPrice {
  currentPrice: number;
  previousClose: number;
}

const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

// Function to fetch real-time stock data
const fetchStockPrice = async (symbol: string): Promise<StockPrice> => {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch stock data');
    }

    const data = await response.json();
    
    if (data.Note || data['Error Message'] || !data['Global Quote']) {
      throw new Error(data.Note || data['Error Message'] || 'No data available');
    }

    const quote = data['Global Quote'];
    return {
      currentPrice: parseFloat(quote['05. price']),
      previousClose: parseFloat(quote['08. previous close']),
    };
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return {
      currentPrice: 0,
      previousClose: 0,
    };
  }
};

const createEmptyPortfolio = async (userId: string) => {
  const portfolioData = {
    id: userId,
    userId,
    name: "My Portfolio",
    balance: 0,
    currency: "USD",
    holdings: {},
    totalValue: 0,
    dayChange: 0,
    dayChangePercentage: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(doc(db, "portfolios", userId), portfolioData);
  return portfolioData;
};

const generatePerformanceData = (portfolio: Portfolio | null): PerformanceData[] => {
  if (!portfolio) return [];
  
  const now = Date.now();
  const totalValue = portfolio.totalValue;
  const dayStart = totalValue - (portfolio.dayChange || 0);

  // Generate data points for the last 24 hours
  const hourlyData = Array.from({ length: 24 }).map((_, i) => {
    const timestamp = now - (23 - i) * 60 * 60 * 1000;
    // Interpolate values between day start and current total
    const progress = i / 23;
    const value = dayStart + (totalValue - dayStart) * progress;
    return { timestamp, value };
  });

  return hourlyData;
};

export function usePortfolio(userId: string) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [recentTrades, setRecentTrades] = useState<TradeOrder[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1D');

  // Effect for initial portfolio data load and Firestore subscription
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    // Subscribe to portfolio updates
    const portfolioUnsubscribe = onSnapshot(
      doc(db, 'portfolios', userId),
      async (snapshot) => {
        if (!isMounted) return;

        try {
          let portfolioData;
          
          if (!snapshot.exists()) {
            console.log("Creating empty portfolio for user:", userId);
            portfolioData = await createEmptyPortfolio(userId);
          } else {
            portfolioData = snapshot.data();
          }

          if (!portfolioData) {
            throw new Error("Failed to get portfolio data");
          }

          // Convert holdings object to array format expected by the UI
          const holdings = portfolioData.holdings || {};
          const holdingsArray = Object.entries(holdings).map(([symbol, holding]) => {
            const holdingData = holding as PortfolioHolding;
            return {
              symbol,
              quantity: holdingData.quantity || 0,
              currentPrice: holdingData.averagePrice || 0,
              previousClose: holdingData.averagePrice || 0,
            };
          });

          const formattedPortfolio: Portfolio = {
            id: snapshot.id,
            userId: portfolioData.userId,
            name: portfolioData.name || "My Portfolio",
            balance: portfolioData.balance || 0,
            currency: portfolioData.currency || 'USD',
            holdings: holdingsArray,
            totalValue: portfolioData.totalValue || 0,
            dayChange: portfolioData.dayChange || 0,
            dayChangePercentage: portfolioData.dayChangePercentage || 0,
            createdAt: portfolioData.createdAt instanceof Timestamp 
              ? portfolioData.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            updatedAt: portfolioData.updatedAt instanceof Timestamp
              ? portfolioData.updatedAt.toDate().toISOString()
              : new Date().toISOString(),
          };

          // Fetch current prices for all holdings
          if (holdingsArray.length > 0) {
            const holdingsWithPrices = await Promise.all(
              holdingsArray.map(async (holding) => {
                const prices = await fetchStockPrice(holding.symbol);
                return {
                  ...holding,
                  currentPrice: prices.currentPrice || holding.currentPrice,
                  previousClose: prices.previousClose || holding.previousClose,
                };
              })
            );

            const totalValue = holdingsWithPrices.reduce(
              (sum, holding) => sum + holding.quantity * holding.currentPrice,
              formattedPortfolio.balance
            );

            const previousValue = holdingsWithPrices.reduce(
              (sum, holding) => sum + holding.quantity * holding.previousClose,
              formattedPortfolio.balance
            );

            const dayChange = totalValue - previousValue;
            const dayChangePercentage = previousValue > 0 
              ? ((dayChange / previousValue) * 100)
              : 0;

            formattedPortfolio.holdings = holdingsWithPrices;
            formattedPortfolio.totalValue = totalValue;
            formattedPortfolio.dayChange = dayChange;
            formattedPortfolio.dayChangePercentage = dayChangePercentage;
          }

          setPortfolio(formattedPortfolio);
          setPerformanceData(generatePerformanceData(formattedPortfolio));
        } catch (err) {
          console.error("Error processing portfolio data:", err);
          setError(err instanceof Error ? err : new Error("Failed to process portfolio data"));
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        if (!isMounted) return;
        console.error("Portfolio subscription error:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Subscribe to recent trades
    const tradesUnsubscribe = onSnapshot(
      query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        if (!isMounted) return;

        try {
          const trades = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              symbol: data.ticker,
              side: data.type,
              orderType: 'market',
              quantity: data.quantity,
              price: data.price,
              status: data.status,
              createdAt: data.createdAt instanceof Timestamp 
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
              updatedAt: data.updatedAt instanceof Timestamp
                ? data.updatedAt.toDate().toISOString()
                : new Date().toISOString(),
            } as TradeOrder;
          });
          setRecentTrades(trades);
        } catch (err) {
          console.error("Error processing trades data:", err);
        }
      },
      (err) => {
        if (!isMounted) return;
        console.error("Trades subscription error:", err);
      }
    );

    return () => {
      isMounted = false;
      portfolioUnsubscribe();
      tradesUnsubscribe();
    };
  }, [userId]);

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
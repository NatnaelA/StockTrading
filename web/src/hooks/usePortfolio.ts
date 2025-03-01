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
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Portfolio,
  TradeOrder,
  PerformanceData,
  TimeRange,
  StockTransaction,
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

interface PortfolioHistoryEntry {
  portfolioId: string;
  userId: string;
  timestamp: Timestamp;
  totalValue: number;
  balance: number;
  holdings: Record<string, { quantity: number; value: number }>;
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

// Function to fetch or calculate historical portfolio values
const fetchPortfolioHistory = async (
  userId: string,
  timeRange: TimeRange,
  currentPortfolio: Portfolio | null
): Promise<PerformanceData[]> => {
  if (!userId || !currentPortfolio) return [];
  
  // Define time range in milliseconds
  const now = Date.now();
  let startTime: number;
  let dataPoints: number;
  
  switch (timeRange) {
    case '1D':
      startTime = now - 24 * 60 * 60 * 1000; // 24 hours ago
      dataPoints = 24; // Hourly data points
      break;
    case '1W':
      startTime = now - 7 * 24 * 60 * 60 * 1000; // 7 days ago
      dataPoints = 7; // Daily data points
      break;
    case '1M':
      startTime = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago
      dataPoints = 30; // Daily data points
      break;
    case '3M':
      startTime = now - 90 * 24 * 60 * 60 * 1000; // 90 days ago
      dataPoints = 90; // Daily data points
      break;
    case '1Y':
      startTime = now - 365 * 24 * 60 * 60 * 1000; // 1 year ago
      dataPoints = 52; // Weekly data points
      break;
    case 'ALL':
    default:
      startTime = now - 5 * 365 * 24 * 60 * 60 * 1000; // 5 years ago
      dataPoints = 60; // Monthly data points
      break;
  }
  
  // First, check if we have historical data in the portfolio_history collection
  const historyQuery = query(
    collection(db, 'portfolio_history'),
    where('userId', '==', userId),
    where('timestamp', '>=', Timestamp.fromMillis(startTime)),
    orderBy('timestamp', 'asc')
  );
  
  try {
    const historySnapshot = await getDocs(historyQuery);
    
    // If we have enough historical data, use it
    if (!historySnapshot.empty && historySnapshot.docs.length >= 3) {
      const historyData = historySnapshot.docs.map(doc => {
        const data = doc.data() as PortfolioHistoryEntry;
        return {
          timestamp: data.timestamp.toMillis(),
          value: data.totalValue
        };
      });
      
      // Add the current portfolio value as the latest data point
      historyData.push({
        timestamp: now,
        value: currentPortfolio.totalValue
      });
      
      return historyData;
    }
    
    // If we don't have enough historical data, calculate it based on transactions
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'asc')
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    
    if (transactionsSnapshot.empty) {
      // If no transactions, return current value for all data points
      return Array.from({ length: dataPoints }).map((_, i) => {
        const timestamp = startTime + (i * (now - startTime) / (dataPoints - 1));
        return {
          timestamp,
          value: currentPortfolio.totalValue
        };
      });
    }
    
    // Process transactions to calculate historical portfolio values
    const transactions = transactionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        type: data.type,
        ticker: data.ticker || data.symbol,
        quantity: Number(data.quantity || 0),
        price: Number(data.price || 0),
        amount: Number(data.amount || 0),
        createdAt: data.createdAt instanceof Timestamp 
          ? data.createdAt.toMillis()
          : new Date(data.createdAt).getTime()
      };
    });
    
    // Sort transactions by date
    transactions.sort((a, b) => a.createdAt - b.createdAt);
    
    // Generate time points for the chart
    const timePoints = Array.from({ length: dataPoints }).map((_, i) => {
      return startTime + (i * (now - startTime) / (dataPoints - 1));
    });
    
    // Calculate portfolio value at each time point
    const performanceData = timePoints.map(timestamp => {
      // Include only transactions that happened before this timestamp
      const relevantTransactions = transactions.filter(t => t.createdAt <= timestamp);
      
      if (relevantTransactions.length === 0) {
        // If no transactions before this time, use 0 or initial deposit
        return { timestamp, value: 0 };
      }
      
      // Calculate portfolio value based on transactions
      let balance = 0;
      const holdings: Record<string, { quantity: number, value: number }> = {};
      
      relevantTransactions.forEach(transaction => {
        if (transaction.type === 'deposit') {
          balance += transaction.amount;
        } else if (transaction.type === 'withdrawal') {
          balance -= transaction.amount;
        } else if (transaction.type === 'buy') {
          balance -= transaction.quantity * transaction.price;
          
          if (!holdings[transaction.ticker]) {
            holdings[transaction.ticker] = { quantity: 0, value: 0 };
          }
          
          holdings[transaction.ticker].quantity += transaction.quantity;
          holdings[transaction.ticker].value = holdings[transaction.ticker].quantity * transaction.price;
        } else if (transaction.type === 'sell') {
          balance += transaction.quantity * transaction.price;
          
          if (holdings[transaction.ticker]) {
            holdings[transaction.ticker].quantity -= transaction.quantity;
            
            if (holdings[transaction.ticker].quantity <= 0) {
              delete holdings[transaction.ticker];
            } else {
              holdings[transaction.ticker].value = holdings[transaction.ticker].quantity * transaction.price;
            }
          }
        }
      });
      
      // Calculate total value (balance + holdings)
      const holdingsValue = Object.values(holdings).reduce((sum, holding) => sum + holding.value, 0);
      const totalValue = balance + holdingsValue;
      
      return { timestamp, value: totalValue };
    });
    
    // Store the calculated history for future use
    // Only store a subset of points to avoid excessive writes
    const pointsToStore = performanceData.filter((_, i) => i % 5 === 0);
    
    for (const point of pointsToStore) {
      try {
        await addDoc(collection(db, 'portfolio_history'), {
          portfolioId: currentPortfolio.id,
          userId,
          timestamp: Timestamp.fromMillis(point.timestamp),
          totalValue: point.value,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error storing portfolio history:', error);
      }
    }
    
    return performanceData;
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
    
    // Fallback to generated data if there's an error
    return generateFallbackPerformanceData(currentPortfolio, timeRange);
  }
};

// Fallback function to generate performance data if real data is unavailable
const generateFallbackPerformanceData = (
  portfolio: Portfolio | null, 
  timeRange: TimeRange
): PerformanceData[] => {
  if (!portfolio) return [];
  
  const now = Date.now();
  const totalValue = portfolio.totalValue;
  const dayChange = portfolio.dayChange || 0;
  const dayStart = totalValue - dayChange;
  
  // Create different data patterns based on the selected time range
  switch (timeRange) {
    case '1D': {
      // Generate hourly data points for the last 24 hours
      return Array.from({ length: 24 }).map((_, i) => {
        const timestamp = now - (23 - i) * 60 * 60 * 1000;
        // Create a more natural curve with some randomness
        const progress = i / 23;
        // Add some small random fluctuations
        const randomFactor = 1 + (Math.random() * 0.02 - 0.01); // ±1% random variation
        const value = dayStart + (totalValue - dayStart) * progress * randomFactor;
        return { timestamp, value: Math.max(0, value) };
      });
    }
    
    case '1W': {
      // Generate daily data for the last week
      return Array.from({ length: 7 }).map((_, i) => {
        const timestamp = now - (6 - i) * 24 * 60 * 60 * 1000;
        // Create a more varied pattern for the week
        const baseChange = dayChange / 5; // Assume daily change is 1/5 of the total day change
        const dailyChange = baseChange * (1 + (Math.random() * 0.5 - 0.25)); // ±25% variation
        const value = totalValue - (dayChange * (6 - i) / 6) + (i > 0 ? (Math.random() - 0.5) * dailyChange * i : 0);
        return { timestamp, value: Math.max(0, value) };
      });
    }
    
    case '1M': {
      // Generate data for the last month (30 days)
      return Array.from({ length: 30 }).map((_, i) => {
        const timestamp = now - (29 - i) * 24 * 60 * 60 * 1000;
        // Create a more realistic monthly pattern with some trends and corrections
        const trend = Math.sin(i / 5) * (dayChange / 3); // Create some waves in the data
        const value = totalValue - dayChange + (dayChange * i / 29) + trend;
        return { timestamp, value: Math.max(0, value) };
      });
    }
    
    case '3M': {
      // Generate data for the last 3 months (90 days)
      return Array.from({ length: 90 }).map((_, i) => {
        const timestamp = now - (89 - i) * 24 * 60 * 60 * 1000;
        // Create a more complex pattern for 3 months
        const trend = Math.sin(i / 15) * (totalValue * 0.05); // 5% wave pattern
        const value = totalValue * 0.9 + (totalValue * 0.1 * i / 89) + trend;
        return { timestamp, value: Math.max(0, value) };
      });
    }
    
    case '1Y': {
      // Generate monthly data for the last year
      return Array.from({ length: 12 }).map((_, i) => {
        const timestamp = now - (11 - i) * 30 * 24 * 60 * 60 * 1000;
        // Create a yearly growth pattern with seasonal variations
        const seasonalFactor = 1 + Math.sin((i + 3) * Math.PI / 6) * 0.03; // Seasonal variation ±3%
        const growthFactor = 1 + (i / 11) * 0.15; // 15% annual growth trend
        const value = (totalValue * 0.85) * seasonalFactor * growthFactor;
        return { timestamp, value: Math.max(0, value) };
      });
    }
    
    case 'ALL':
    default: {
      // Generate yearly data for the last 5 years
      return Array.from({ length: 20 }).map((_, i) => {
        const timestamp = now - (19 - i) * 3 * 30 * 24 * 60 * 60 * 1000; // Quarterly data points
        // Create a long-term growth pattern with market cycles
        const cycleFactor = 1 + Math.sin(i * Math.PI / 10) * 0.1; // Market cycles ±10%
        const growthFactor = Math.pow(1.12, i / 4); // Compound growth rate
        const value = (totalValue * 0.6) * cycleFactor * growthFactor;
        return { timestamp, value: Math.max(0, value) };
      });
    }
  }
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
          
          // Fetch real historical performance data
          const historyData = await fetchPortfolioHistory(userId, selectedTimeRange, formattedPortfolio);
          setPerformanceData(historyData);
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

  // Update performance data when time range changes
  useEffect(() => {
    if (portfolio) {
      setLoading(true);
      fetchPortfolioHistory(userId, selectedTimeRange, portfolio)
        .then(historyData => {
          setPerformanceData(historyData);
        })
        .catch(err => {
          console.error("Error fetching portfolio history:", err);
          // Fallback to generated data
          setPerformanceData(generateFallbackPerformanceData(portfolio, selectedTimeRange));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [portfolio, selectedTimeRange, userId]);

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
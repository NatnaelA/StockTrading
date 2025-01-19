import { useState, useEffect } from 'react';

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  lastUpdated: string;
}

// Alpha Vantage free tier allows 5 API calls per minute, 500 per day
const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

export function useStockData(symbol: string) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = async (symbol: string) => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    try {
      // Alpha Vantage API call
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }

      const data = await response.json();

      // Check if we hit the API rate limit
      if (data.Note) {
        throw new Error('API rate limit reached. Please try again in a minute.');
      }

      // Check if the symbol exists
      if (data['Error Message']) {
        throw new Error('Invalid symbol or no data available');
      }

      const globalQuote = data['Global Quote'];
      if (!globalQuote) {
        throw new Error('No data available for this symbol');
      }

      // Parse Alpha Vantage response
      const stockQuote: StockQuote = {
        symbol: globalQuote['01. symbol'],
        price: parseFloat(globalQuote['05. price']),
        change: parseFloat(globalQuote['09. change']),
        changePercent: parseFloat(globalQuote['10. change percent'].replace('%', '')),
        high: parseFloat(globalQuote['03. high']),
        low: parseFloat(globalQuote['04. low']),
        volume: parseInt(globalQuote['06. volume']),
        lastUpdated: globalQuote['07. latest trading day'],
      };

      setQuote(stockQuote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchQuote(symbol);

      // Alpha Vantage free tier is limited to 5 calls per minute
      // So we'll refresh every 20 seconds (3 times per minute)
      const interval = setInterval(() => {
        fetchQuote(symbol);
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [symbol]);

  return {
    quote,
    loading,
    error,
    refetch: () => fetchQuote(symbol),
  };
} 
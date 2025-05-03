"use client";

import { useState, useEffect } from 'react';
// Import Supabase client
import { createClient } from '@/lib/supabase-client'; 

interface StockQuote {
  symbol: string;
  price: number; // Mapped from current_price
  change: number; // Mapped from day_change
  changePercent: number; // Mapped from day_change_percentage
  // Using placeholders or default values for fields not in our table
  high: number; 
  low: number;
  volume: number;
  lastUpdated: string; // Mapped from last_updated
}

// Remove Alpha Vantage API key usage
// const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

// Create Supabase client instance outside the hook for reuse
const supabase = createClient();

export function useStockData(symbol: string) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = async (symbol: string) => {
    if (!symbol) {
        setQuote(null); // Clear quote if symbol is empty
        setError(null);
        return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch from Supabase public.stocks table
      console.log(`Fetching stock data for ${symbol} from Supabase.`);
      
      const { data: stockData, error: dbError } = await supabase
        .from('stocks')
        .select('symbol, name, current_price, day_change, day_change_percentage, last_updated')
        .eq('symbol', symbol)
        .single(); // Expect only one row for a given symbol

      if (dbError) {
          if (dbError.code === 'PGRST116') { // Code for "Not found"
              console.log(`Symbol ${symbol} not found in Supabase stocks table.`);
              throw new Error(`Stock symbol "${symbol}" not found.`);
          } else {
              console.error('Supabase query error:', dbError);
              throw new Error('Failed to fetch stock data from database.');
          }
      }

      if (!stockData) {
          console.log(`No data returned for symbol ${symbol} from Supabase.`);
          throw new Error(`No data found for stock symbol "${symbol}".`);
      }

      // Map Supabase data to StockQuote interface
      const stockQuote: StockQuote = {
        symbol: stockData.symbol,
        price: stockData.current_price ?? 0, // Use current_price for price
        change: stockData.day_change ?? 0,
        changePercent: stockData.day_change_percentage ?? 0,
        // Use placeholder values for missing fields
        high: stockData.current_price ?? 0, // Placeholder: use current price
        low: stockData.current_price ?? 0,  // Placeholder: use current price
        volume: 0, // Placeholder: no volume data in our table
        lastUpdated: stockData.last_updated ? new Date(stockData.last_updated).toISOString() : new Date().toISOString(), 
      };

      console.log('Successfully fetched stock quote from Supabase:', stockQuote);
      setQuote(stockQuote);
    } catch (err) {
      console.error('Error in fetchQuote (Supabase):', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data only when the symbol changes
    fetchQuote(symbol);

    // Remove the interval logic
    // const interval = setInterval(() => {
    //   fetchQuote(symbol);
    // }, 20000);
    // return () => clearInterval(interval);

  }, [symbol]); // Dependency array only includes symbol

  return {
    quote,
    loading,
    error,
    refetch: () => fetchQuote(symbol), // Keep refetch function if needed
  };
} 
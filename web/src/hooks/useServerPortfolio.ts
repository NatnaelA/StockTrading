"use client";

import { useState, useEffect, useCallback } from 'react';
import { Portfolio, PerformanceData, TimeRange } from '@/types/trading';
import { UserProfile } from '@/hooks/useAuth'; // Assuming UserProfile is defined here or in types

/**
 * Hook for fetching portfolio and profile data from the server API
 */
export function useServerPortfolio(userId: string | undefined) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null); // Add state for profile
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1M');

  // Create a memoized function to fetch portfolio data
  const fetchPortfolio = useCallback(async () => {
    if (!userId) {
      console.log('No userId provided to useServerPortfolio hook');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Call the server API
      const response = await fetch(`/api/portfolios/user-portfolio`, {
        credentials: 'include', // Important for sending cookies
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch portfolio');
      }
      
      setPortfolio(data.portfolio);
      setProfile(data.profile); // Set profile state

      // Fetch history only if portfolio exists
      if (data.portfolio) {
        fetchPortfolioHistory(data.portfolio.id);
      } else {
        setLoading(false); // No portfolio, no history to fetch, stop loading
      }
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  }, [userId]);

  // Fetch portfolio data on mount and when userId changes
  useEffect(() => {
    let isMounted = true;
    
    const loadPortfolio = async () => {
      await fetchPortfolio();
      if (!isMounted) return;
    };
    
    loadPortfolio();
    
    return () => {
      isMounted = false;
    };
  }, [userId, fetchPortfolio]);

  // Fetch portfolio history data
  const fetchPortfolioHistory = async (portfolioId?: string) => {
    if (!portfolioId) {
      setLoading(false);
      return;
    }

    try {
      // Build the API URL with query parameters
      const params = new URLSearchParams({
        portfolioId,
        timeRange: selectedTimeRange
      });
      
      const url = `/api/portfolios/history?${params.toString()}`;
      
      // Call the server API
      const response = await fetch(url, {
        credentials: 'include', // Important for sending cookies
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch portfolio history');
      }
      
      setPerformanceData(data.performanceData || []);
    } catch (err) {
      console.error('Error fetching portfolio history:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update the time range and fetch new data
  const updateTimeRange = (range: TimeRange) => {
    setSelectedTimeRange(range);
    // Re-fetch data with the new time range
    if (portfolio?.id) {
      fetchPortfolioHistory(portfolio.id);
    }
  };

  return {
    portfolio,
    profile, // Return profile state
    performanceData,
    loading,
    error,
    selectedTimeRange,
    updateTimeRange,
    refetch: fetchPortfolio
  };
} 
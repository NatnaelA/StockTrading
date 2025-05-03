'use client';

import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Type definitions
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  photo_url?: string;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  currency: string;
  holdings: Record<string, any>;
  total_value: number;
  day_change: number;
  day_change_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  portfolio_id: string;
  stock_symbol?: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW';
  quantity?: number;
  price?: number;
  fee?: number;
  total_amount: number;
  date: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  notes?: string;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange?: string;
  current_price?: number;
  day_change?: number;
  day_change_percentage?: number;
  last_updated?: string;
}

// User profile operations
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data as UserProfile;
};

export const createUserProfile = async (user: User, profileData: Partial<UserProfile> = {}): Promise<UserProfile | null> => {
  const profile: Partial<UserProfile> = {
    id: user.id,
    email: user.email || '',
    display_name: user.user_metadata?.displayName,
    photo_url: user.user_metadata?.photoURL,
    profile_completed: false,
    ...profileData
  };
  
  const { data, error } = await supabase
    .from('users')
    .insert(profile)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
  
  return data as UserProfile;
};

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .update(profileData)
    .eq('id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
  
  return data as UserProfile;
};

// Portfolio operations
export const getUserPortfolios = async (userId: string): Promise<Portfolio[]> => {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching portfolios:', error);
    return [];
  }
  
  return data as Portfolio[];
};

export const getPortfolio = async (portfolioId: string): Promise<Portfolio | null> => {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', portfolioId)
    .single();
    
  if (error) {
    console.error('Error fetching portfolio:', error);
    return null;
  }
  
  return data as Portfolio;
};

export const createPortfolio = async (userId: string, portfolio: Partial<Portfolio>): Promise<Portfolio | null> => {
  const newPortfolio: Partial<Portfolio> = {
    user_id: userId,
    name: 'My Portfolio',
    balance: 0,
    currency: 'USD',
    holdings: {},
    total_value: 0,
    day_change: 0,
    day_change_percentage: 0,
    ...portfolio
  };
  
  const { data, error } = await supabase
    .from('portfolios')
    .insert(newPortfolio)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating portfolio:', error);
    return null;
  }
  
  return data as Portfolio;
};

export const updatePortfolio = async (portfolioId: string, portfolioData: Partial<Portfolio>): Promise<Portfolio | null> => {
  const { data, error } = await supabase
    .from('portfolios')
    .update(portfolioData)
    .eq('id', portfolioId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating portfolio:', error);
    return null;
  }
  
  return data as Portfolio;
};

// Transaction operations
export const getTransactions = async (userId: string, portfolioId?: string): Promise<Transaction[]> => {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);
    
  if (portfolioId) {
    query = query.eq('portfolio_id', portfolioId);
  }
  
  const { data, error } = await query.order('date', { ascending: false });
    
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return data as Transaction[];
};

export const createTransaction = async (transaction: Partial<Transaction>): Promise<Transaction | null> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
  
  return data as Transaction;
};

// Stock operations
export const getStocks = async (symbols?: string[]): Promise<Stock[]> => {
  let query = supabase.from('stocks').select('*');
  
  if (symbols && symbols.length > 0) {
    query = query.in('symbol', symbols);
  }
  
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching stocks:', error);
    return [];
  }
  
  return data as Stock[];
};

export const getStock = async (symbol: string): Promise<Stock | null> => {
  const { data, error } = await supabase
    .from('stocks')
    .select('*')
    .eq('symbol', symbol)
    .single();
    
  if (error) {
    console.error('Error fetching stock:', error);
    return null;
  }
  
  return data as Stock;
};

export const upsertStock = async (stock: Partial<Stock>): Promise<Stock | null> => {
  const { data, error } = await supabase
    .from('stocks')
    .upsert(stock, { onConflict: 'symbol' })
    .select()
    .single();
    
  if (error) {
    console.error('Error upserting stock:', error);
    return null;
  }
  
  return data as Stock;
}; 
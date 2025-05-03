import { Timestamp } from 'firebase/firestore';

export type TimeRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";
export type DocumentType = "statement" | "tax" | "trade";
export type OrderType = "market" | "limit" | "stop";
export type OrderSide = "buy" | "sell";

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  balance: number;
  currency: string;
  holdings: {
    symbol: string;
    quantity: number;
    currentPrice: number;
    previousClose: number;
  }[];
  totalValue: number;
  dayChange: number;
  dayChangePercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface TradeOrder {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  orderType: "market" | "limit";
  quantity: number;
  price: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface TradeDocument {
  id: string;
  type: DocumentType;
  date: string;
  description: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceData {
  timestamp: number;
  value: number;
}

export interface StockTransaction {
  id: string;
  userId: string;
  ticker: string;
  quantity: number;
  price: number;
  type: 'buy' | 'sell' | 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW';
  status: 'pending' | 'completed' | 'failed' | 'PENDING' | 'COMPLETED' | 'FAILED';
  date: Date | string;
}

export interface UserPortfolio {
  id: string;
  userId: string;
  name: string;
  balance: number;
  currency: string;
  holdings: {
    [ticker: string]: {
      quantity: number;
      averagePrice: number;
      lastUpdated: Timestamp;
    };
  };
  totalValue: number;
  dayChange: number;
  dayChangePercentage: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface UserDocument {
  id: string;
  userId: string;
  type: 'tax_statement' | 'transaction_confirmation' | 'account_statement';
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  periodStart?: string;
  periodEnd?: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}
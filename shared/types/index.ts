export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  quantity: number;
  price: number;
  type: 'BUY' | 'SELL';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export interface Portfolio {
  userId: string;
  holdings: {
    [symbol: string]: {
      quantity: number;
      averagePrice: number;
    };
  };
  lastUpdated: Date;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
} 
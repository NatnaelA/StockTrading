import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { OrderSide, OrderType } from '@/types/trading';

interface TradeFormData {
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
}

export function useTrade() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const validateTrade = (data: TradeFormData): string[] => {
    const errors: string[] = [];

    if (!data.symbol) {
      errors.push('Symbol is required');
    }

    if (data.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (data.orderType === 'limit' && !data.price) {
      errors.push('Limit price is required for limit orders');
    }

    if (data.orderType === 'stop' && !data.stopPrice) {
      errors.push('Stop price is required for stop orders');
    }

    return errors;
  };

  const submitTrade = async (data: TradeFormData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const tradeData = {
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'trades'), tradeData);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    submitTrade,
    validateTrade,
    loading,
    error,
  };
} 
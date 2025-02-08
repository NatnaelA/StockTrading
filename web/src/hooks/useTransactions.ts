"use client";

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StockTransaction } from '@/types/trading';

const processTimestamp = (timestamp: any): Timestamp => {
  if (timestamp instanceof Timestamp) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return Timestamp.fromDate(new Date(timestamp));
  }
  if (typeof timestamp === 'number') {
    return Timestamp.fromMillis(timestamp);
  }
  return Timestamp.now();
};

const processTransaction = (doc: QueryDocumentSnapshot<DocumentData>): StockTransaction => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    ticker: data.ticker,
    quantity: Number(data.quantity),
    price: Number(data.price),
    type: data.type,
    status: data.status || 'completed',
    createdAt: processTimestamp(data.createdAt),
    updatedAt: processTimestamp(data.updatedAt || data.createdAt),
  };
};

export function useTransactions(userId: string) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const baseQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        limit(10)
      );

      const unsubscribe = onSnapshot(
        baseQuery,
        {
          next: (snapshot) => {
            try {
              const newTransactions = snapshot.docs
                .map(processTransaction)
                .sort((a, b) => {
                  // We know these are Timestamps because processTransaction ensures it
                  const timeA = (a.createdAt as Timestamp).toMillis();
                  const timeB = (b.createdAt as Timestamp).toMillis();
                  return timeB - timeA;
                });

              setTransactions(newTransactions);
              setError(null);
            } catch (err) {
              console.error('Error processing transactions:', err);
              setError('Failed to process transactions data. Please try again.');
            } finally {
              setLoading(false);
            }
          },
          error: (err) => {
            console.error('Snapshot listener error:', err);
            setError('Failed to load transactions. Please check your connection and try again.');
            setLoading(false);
          }
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up transaction listener:', err);
      setError('Failed to set up transactions listener. Please refresh the page.');
      setLoading(false);
    }
  }, [userId]);

  return { transactions, loading, error };
} 
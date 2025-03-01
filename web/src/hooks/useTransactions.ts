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
    ticker: data.ticker || data.symbol, // Handle both ticker and symbol fields
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
      console.log('No userId provided to useTransactions hook');
      setLoading(false);
      return;
    }

    console.log(`Fetching transactions for user: ${userId}`);
    let unsubscribe: () => void;

    try {
      // Create a query that matches our security rules
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50) // Keep under the 100 limit in our security rules
      );

      console.log('Transaction query created:', transactionsQuery);

      unsubscribe = onSnapshot(
        transactionsQuery,
        (snapshot) => {
          try {
            console.log(`Retrieved ${snapshot.docs.length} transactions`);
            
            if (snapshot.empty) {
              console.log('No transactions found for this user');
              setTransactions([]);
              setLoading(false);
              return;
            }

            const newTransactions = snapshot.docs
              .map(doc => {
                try {
                  return processTransaction(doc);
                } catch (err) {
                  console.error(`Error processing transaction ${doc.id}:`, err);
                  return null;
                }
              })
              .filter((transaction): transaction is StockTransaction => transaction !== null)
              .sort((a, b) => {
                // We know these are Timestamps because processTransaction ensures it
                const timeA = (a.createdAt as Timestamp).toMillis();
                const timeB = (b.createdAt as Timestamp).toMillis();
                return timeB - timeA;
              });

            console.log(`Processed ${newTransactions.length} transactions successfully`);
            setTransactions(newTransactions);
            setError(null);
            setLoading(false);
          } catch (err) {
            console.error('Error processing transactions:', err);
            setError('Failed to process transactions data');
            setLoading(false);
          }
        },
        (err) => {
          console.error('Firestore snapshot listener error:', err);
          setError('Failed to load transactions');
          setLoading(false);
        }
      );
    } catch (err: any) {
      console.error('Error setting up transaction listener:', err);
      setError('Failed to set up transactions listener');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        console.log('Unsubscribing from transactions listener');
        unsubscribe();
      }
    };
  }, [userId]);

  return { transactions, loading, error };
} 
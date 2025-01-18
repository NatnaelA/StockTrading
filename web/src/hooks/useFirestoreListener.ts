import { useEffect } from 'react';
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  query,
  where,
  DocumentData,
  Query,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

type ListenerCallback = (data: DocumentData) => void;

export function useDocumentListener(
  path: string,
  callback: ListenerCallback,
  deps: any[] = []
) {
  useEffect(() => {
    const db = getFirestore();
    const unsubscribe = onSnapshot(doc(db, path), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });

    return () => unsubscribe();
  }, deps);
}

export function useCollectionListener(
  collectionPath: string,
  queryConstraints: any[] = [],
  callback: ListenerCallback,
  deps: any[] = []
) {
  useEffect(() => {
    const db = getFirestore();
    const q = query(collection(db, collectionPath), ...queryConstraints);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(data);
    });

    return () => unsubscribe();
  }, deps);
}

export function usePortfolioListener(
  portfolioId: string,
  callback: ListenerCallback,
  deps: any[] = []
) {
  useDocumentListener(`portfolios/${portfolioId}`, callback, deps);
}

export function useTradesListener(
  portfolioId: string,
  callback: ListenerCallback,
  deps: any[] = []
) {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useCollectionListener(
    'trades',
    [where('portfolioId', '==', portfolioId), where('userId', '==', userId)],
    callback,
    deps
  );
}

export function useTransactionsListener(
  portfolioId: string,
  callback: ListenerCallback,
  deps: any[] = []
) {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useCollectionListener(
    'transactions',
    [where('portfolioId', '==', portfolioId), where('userId', '==', userId)],
    callback,
    deps
  );
} 
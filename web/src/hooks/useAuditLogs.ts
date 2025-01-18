import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuditLog, AuditFilters } from '@/types/audit';

export function useAuditLogs(filters: AuditFilters) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    let q = query(
      collection(db, 'auditLogs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    if (filters.startDate) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }

    if (filters.endDate) {
      q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }

    if (filters.actions?.length) {
      q = query(q, where('action', 'in', filters.actions));
    }

    if (filters.userId) {
      q = query(q, where('initiatedBy.userId', '==', filters.userId));
    }

    if (filters.targetId) {
      q = query(q, where('target.id', '==', filters.targetId));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newLogs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp.toDate(),
          } as AuditLog;
        });
        setLogs(newLogs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching audit logs:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filters]);

  return { logs, loading, error };
} 
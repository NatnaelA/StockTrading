import { collection, query, where, orderBy, limit, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuditAction, AuditLog, AuditFilters } from '@/types/audit';

// Helper function to create a basic audit log entry
export async function createAuditLog(
  action: AuditAction,
  initiatedBy: { userId: string; email: string; role: string },
  details: { description: string; metadata: Record<string, any> },
  target?: { type: 'user' | 'trade' | 'deposit' | 'withdrawal' | 'firm'; id: string }
): Promise<string> {
  const auditLog: Omit<AuditLog, 'id'> = {
    action,
    timestamp: new Date(),
    initiatedBy,
    details,
    target,
  };

  const docRef = await addDoc(collection(db, 'auditLogs'), {
    ...auditLog,
    timestamp: Timestamp.fromDate(auditLog.timestamp),
  });

  return docRef.id;
}

// Helper functions for common audit actions
export async function logUserAction(
  action: Extract<AuditAction, 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_REGISTER' | 'USER_UPDATE' | 'USER_DELETE'>,
  initiatedBy: { userId: string; email: string; role: string },
  targetUser: { id: string; email: string },
  details?: Record<string, any>
) {
  return createAuditLog(
    action,
    initiatedBy,
    {
      description: `User action: ${action.toLowerCase().replace('_', ' ')} for ${targetUser.email}`,
      metadata: details || {},
    },
    {
      type: 'user',
      id: targetUser.id,
    }
  );
}

export async function logTradeAction(
  action: Extract<AuditAction, 'TRADE_REQUEST' | 'TRADE_APPROVE' | 'TRADE_REJECT'>,
  initiatedBy: { userId: string; email: string; role: string },
  trade: { id: string; symbol: string; quantity: number; type: string },
  details?: Record<string, any>
) {
  return createAuditLog(
    action,
    initiatedBy,
    {
      description: `Trade ${action.toLowerCase().replace('_', ' ')}: ${trade.quantity} ${trade.symbol} (${trade.type})`,
      metadata: details || {},
    },
    {
      type: 'trade',
      id: trade.id,
    }
  );
}

export async function logPaymentAction(
  action: Extract<AuditAction, 'DEPOSIT_REQUEST' | 'DEPOSIT_COMPLETE' | 'WITHDRAWAL_REQUEST' | 'WITHDRAWAL_COMPLETE'>,
  initiatedBy: { userId: string; email: string; role: string },
  payment: { id: string; amount: number; currency: string },
  details?: Record<string, any>
) {
  const type = action.startsWith('DEPOSIT') ? 'deposit' : 'withdrawal';
  return createAuditLog(
    action,
    initiatedBy,
    {
      description: `${type} ${action.toLowerCase().replace('_', ' ')}: ${payment.amount} ${payment.currency}`,
      metadata: details || {},
    },
    {
      type,
      id: payment.id,
    }
  );
}

export async function logKYCAction(
  action: Extract<AuditAction, 'KYC_SUBMIT' | 'KYC_UPDATE'>,
  initiatedBy: { userId: string; email: string; role: string },
  targetUser: { id: string; email: string },
  details?: Record<string, any>
) {
  return createAuditLog(
    action,
    initiatedBy,
    {
      description: `KYC ${action.toLowerCase().replace('_', ' ')} for ${targetUser.email}`,
      metadata: details || {},
    },
    {
      type: 'user',
      id: targetUser.id,
    }
  );
}

export async function logBrokerAction(
  action: Extract<AuditAction, 'BROKER_INVITE' | 'BROKER_REMOVE'>,
  initiatedBy: { userId: string; email: string; role: string },
  broker: { id: string; email: string },
  firm: { id: string; name: string },
  details?: Record<string, any>
) {
  return createAuditLog(
    action,
    initiatedBy,
    {
      description: `Broker ${action.toLowerCase().replace('_', ' ')}: ${broker.email} ${action === 'BROKER_INVITE' ? 'to' : 'from'} ${firm.name}`,
      metadata: { ...details, firmId: firm.id },
    },
    {
      type: 'user',
      id: broker.id,
    }
  );
}

export async function logFirmAction(
  action: Extract<AuditAction, 'FIRM_CREATE' | 'FIRM_UPDATE'>,
  initiatedBy: { userId: string; email: string; role: string },
  firm: { id: string; name: string },
  details?: Record<string, any>
) {
  return createAuditLog(
    action,
    initiatedBy,
    {
      description: `Firm ${action.toLowerCase().replace('_', ' ')}: ${firm.name}`,
      metadata: details || {},
    },
    {
      type: 'firm',
      id: firm.id,
    }
  );
}

export async function getAuditLogs(filters: AuditFilters): Promise<AuditLog[]> {
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

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp.toDate(),
    } as AuditLog;
  });
}

export async function exportAuditLogs(logs: AuditLog[]): Promise<string> {
  const csvRows = [
    // CSV Header
    ['Timestamp', 'Action', 'Initiated By', 'Role', 'Description', 'Target Type', 'Target ID'].join(','),
    // CSV Data
    ...logs.map((log) => [
      log.timestamp.toISOString(),
      log.action,
      log.initiatedBy.email,
      log.initiatedBy.role,
      log.details.description,
      log.target?.type || '',
      log.target?.id || '',
    ].join(',')),
  ];

  return csvRows.join('\n');
} 
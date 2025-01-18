export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTER'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'TRADE_REQUEST'
  | 'TRADE_APPROVE'
  | 'TRADE_REJECT'
  | 'DEPOSIT_REQUEST'
  | 'DEPOSIT_COMPLETE'
  | 'WITHDRAWAL_REQUEST'
  | 'WITHDRAWAL_COMPLETE'
  | 'KYC_SUBMIT'
  | 'KYC_UPDATE'
  | 'ROLE_CHANGE'
  | 'BROKER_INVITE'
  | 'BROKER_REMOVE'
  | 'FIRM_CREATE'
  | 'FIRM_UPDATE';

export interface AuditLog {
  id: string;
  action: AuditAction;
  timestamp: Date;
  initiatedBy: {
    userId: string;
    email: string;
    role: string;
  };
  details: {
    description: string;
    metadata: Record<string, any>;
  };
  target?: {
    type: 'user' | 'trade' | 'deposit' | 'withdrawal' | 'firm';
    id: string;
  };
}

export interface AuditFilters {
  startDate?: Date;
  endDate?: Date;
  actions?: AuditAction[];
  userId?: string;
  targetId?: string;
} 
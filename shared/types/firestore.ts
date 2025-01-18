import { User, Trade, Portfolio, StockQuote } from './index';

export type UserRole = 
  | 'individual'
  | 'broker-junior'
  | 'broker-senior'
  | 'support'
  | 'audit'
  | 'super-admin';

export interface FirestoreUser extends Omit<User, 'id'> {
  role: UserRole;
  brokerageId?: string;
  phoneNumber?: string;
  address?: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  kycDocuments?: {
    idDocument?: string;
    proofOfAddress?: string;
    otherDocuments?: string[];
  };
  bankAccounts?: {
    id: string;
    accountNumber: string;
    bankName: string;
    accountType: string;
    isDefault: boolean;
  }[];
}

export interface BrokerageFirm {
  id: string;
  name: string;
  licenseNumber: string;
  address: string;
  phoneNumber: string;
  email: string;
  website?: string;
  status: 'active' | 'suspended' | 'inactive';
  commissionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirestorePortfolio extends Omit<Portfolio, 'userId'> {
  brokerageId: string;
  userId: string;
  accountNumber: string;
  accountType: 'cash' | 'margin';
  status: 'active' | 'suspended' | 'closed';
  balance: {
    available: number;
    pending: number;
    total: number;
  };
  marginDetails?: {
    limit: number;
    used: number;
    available: number;
    maintenanceMargin: number;
  };
}

export interface FirestoreTrade extends Omit<Trade, 'userId'> {
  brokerageId: string;
  portfolioId: string;
  orderType: 'market' | 'limit' | 'stop' | 'stop-limit';
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  commission: number;
  notes?: string;
  executedBy?: string; // broker's userId
  approvedBy?: string; // senior broker's userId for large trades
}

export interface Transaction {
  id: string;
  userId: string;
  brokerageId: string;
  portfolioId: string;
  type: 'deposit' | 'withdrawal' | 'fee' | 'commission' | 'interest';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  processedBy?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'read';
  resource: string;
  resourceId: string;
  changes?: {
    before: any;
    after: any;
  };
  metadata?: {
    ip?: string;
    userAgent?: string;
    location?: string;
  };
} 
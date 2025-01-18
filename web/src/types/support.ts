export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'pending' | 'solved' | 'closed';

export type TicketCategory = 
  | 'account'
  | 'trading'
  | 'deposits'
  | 'withdrawals'
  | 'kyc'
  | 'technical'
  | 'other';

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  zendeskId: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: {
    name: string;
    url: string;
    contentType: string;
  }[];
}

export interface CreateTicketInput {
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  attachments?: File[];
}

export interface TicketUpdate {
  status: TicketStatus;
  comment?: string;
  internalNote?: string;
}

export interface TicketFilters {
  status?: TicketStatus[];
  category?: TicketCategory[];
  userId?: string;
  startDate?: Date;
  endDate?: Date;
} 
import { collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CreateTicketInput, SupportTicket, TicketUpdate, TicketFilters } from '@/types/support';
import { logUserAction } from '@/services/auditService';

const ZENDESK_API_URL = process.env.NEXT_PUBLIC_ZENDESK_API_URL;
const ZENDESK_API_TOKEN = process.env.NEXT_PUBLIC_ZENDESK_API_TOKEN;

async function createZendeskTicket(
  ticket: CreateTicketInput,
  user: { id: string; email: string; firstName?: string; lastName?: string }
) {
  const response = await fetch(`${ZENDESK_API_URL}/api/v2/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZENDESK_API_TOKEN}`,
    },
    body: JSON.stringify({
      ticket: {
        subject: ticket.subject,
        comment: { body: ticket.description },
        priority: ticket.priority,
        custom_fields: [
          { id: 'category', value: ticket.category },
          { id: 'user_id', value: user.id },
        ],
        requester: {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create Zendesk ticket');
  }

  return response.json();
}

export async function createTicket(
  input: CreateTicketInput,
  user: { id: string; email: string; role: string; firstName?: string; lastName?: string }
): Promise<SupportTicket> {
  // Create ticket in Zendesk
  const zendeskResponse = await createZendeskTicket(input, user);
  const zendeskId = zendeskResponse.ticket.id;

  // Create ticket in Firestore
  const ticketData: Omit<SupportTicket, 'id'> = {
    userId: user.id,
    userEmail: user.email,
    category: input.category,
    subject: input.subject,
    description: input.description,
    priority: input.priority,
    status: 'open',
    zendeskId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, 'supportTickets'), {
    ...ticketData,
    createdAt: Timestamp.fromDate(ticketData.createdAt),
    updatedAt: Timestamp.fromDate(ticketData.updatedAt),
  });

  // Log ticket creation
  await logUserAction(
    'USER_UPDATE',
    { userId: user.id, email: user.email, role: user.role },
    { id: user.id, email: user.email },
    { action: 'create_support_ticket', ticketId: docRef.id }
  );

  return {
    id: docRef.id,
    ...ticketData,
  };
}

export async function updateTicket(
  ticketId: string,
  update: TicketUpdate,
  user: { id: string; email: string; role: string }
): Promise<void> {
  // Get ticket from Firestore
  const ticketRef = doc(db, 'supportTickets', ticketId);
  const ticketDoc = await getDoc(ticketRef);

  if (!ticketDoc.exists()) {
    throw new Error('Ticket not found');
  }

  const ticket = ticketDoc.data() as SupportTicket;

  // Update ticket in Zendesk
  const response = await fetch(`${ZENDESK_API_URL}/api/v2/tickets/${ticket.zendeskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZENDESK_API_TOKEN}`,
    },
    body: JSON.stringify({
      ticket: {
        status: update.status,
        comment: update.comment ? { body: update.comment, public: true } : undefined,
        internal_note: update.internalNote,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update Zendesk ticket');
  }

  // Update ticket in Firestore
  await updateDoc(ticketRef, {
    status: update.status,
    updatedAt: Timestamp.fromDate(new Date()),
  });

  // Log ticket update
  await logUserAction(
    'USER_UPDATE',
    { userId: user.id, email: user.email, role: user.role },
    { id: ticket.userId, email: ticket.userEmail },
    { action: 'update_support_ticket', ticketId, update }
  );
}

export async function getTicket(ticketId: string): Promise<SupportTicket> {
  const ticketDoc = await getDoc(doc(db, 'supportTickets', ticketId));

  if (!ticketDoc.exists()) {
    throw new Error('Ticket not found');
  }

  const data = ticketDoc.data();
  return {
    id: ticketDoc.id,
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as SupportTicket;
}

export async function getTickets(filters: TicketFilters): Promise<SupportTicket[]> {
  let q = query(collection(db, 'supportTickets'));

  if (filters.status?.length) {
    q = query(q, where('status', 'in', filters.status));
  }

  if (filters.category?.length) {
    q = query(q, where('category', 'in', filters.category));
  }

  if (filters.userId) {
    q = query(q, where('userId', '==', filters.userId));
  }

  if (filters.startDate) {
    q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
  }

  if (filters.endDate) {
    q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as SupportTicket;
  });
}

export async function handleZendeskWebhook(
  payload: any
): Promise<void> {
  const ticketId = payload.ticket_id;
  const status = payload.status;
  const comment = payload.comment?.body;

  // Find ticket in Firestore by Zendesk ID
  const q = query(collection(db, 'supportTickets'), where('zendeskId', '==', ticketId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('Ticket not found');
  }

  const ticketDoc = snapshot.docs[0];
  await updateDoc(ticketDoc.ref, {
    status,
    updatedAt: Timestamp.fromDate(new Date()),
  });
} 
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Helper function to create audit log
async function createAuditLog(
  userId: string,
  action: 'create' | 'update' | 'delete' | 'read',
  resource: string,
  resourceId: string,
  changes?: { before: any; after: any },
  context?: functions.https.CallableContext
) {
  const metadata = context ? {
    ip: context.rawRequest.ip,
    userAgent: context.rawRequest.headers['user-agent'],
    // You might want to add location based on IP using a geolocation service
  } : undefined;

  await db.collection('auditLogs').add({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    userId,
    action,
    resource,
    resourceId,
    changes,
    metadata
  });
}

// Audit logging for trades
export const onTradeWrite = functions.firestore
  .document('trades/{tradeId}')
  .onWrite(async (change, context) => {
    const tradeId = context.params.tradeId;
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    let action: 'create' | 'update' | 'delete';
    if (!beforeData && afterData) {
      action = 'create';
    } else if (beforeData && !afterData) {
      action = 'delete';
    } else {
      action = 'update';
    }

    await createAuditLog(
      afterData?.userId || beforeData?.userId,
      action,
      'trades',
      tradeId,
      {
        before: beforeData,
        after: afterData
      }
    );
  });

// Audit logging for portfolio updates
export const onPortfolioWrite = functions.firestore
  .document('portfolios/{portfolioId}')
  .onWrite(async (change, context) => {
    const portfolioId = context.params.portfolioId;
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    let action: 'create' | 'update' | 'delete';
    if (!beforeData && afterData) {
      action = 'create';
    } else if (beforeData && !afterData) {
      action = 'delete';
    } else {
      action = 'update';
    }

    await createAuditLog(
      afterData?.userId || beforeData?.userId,
      action,
      'portfolios',
      portfolioId,
      {
        before: beforeData,
        after: afterData
      }
    );
  });

// Audit logging for user profile updates
export const onUserWrite = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    let action: 'create' | 'update' | 'delete';
    if (!beforeData && afterData) {
      action = 'create';
    } else if (beforeData && !afterData) {
      action = 'delete';
    } else {
      action = 'update';
    }

    // Remove sensitive information from audit logs
    const sanitizeUserData = (data: any) => {
      if (!data) return null;
      const { bankAccounts, kycDocuments, ...safeData } = data;
      return safeData;
    };

    await createAuditLog(
      userId,
      action,
      'users',
      userId,
      {
        before: sanitizeUserData(beforeData),
        after: sanitizeUserData(afterData)
      }
    );
  }); 
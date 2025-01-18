import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onTradeWrite, onPortfolioWrite, onUserWrite } from './audit';

admin.initializeApp();

// Export audit logging functions
export { onTradeWrite, onPortfolioWrite, onUserWrite };

interface TradeValidationData {
  symbol: string;
  quantity: number;
  price: number;
  type: 'BUY' | 'SELL';
  portfolioId: string;
}

// Example function to validate a trade
export const validateTrade = functions.https.onCall(async (data: TradeValidationData, context: functions.https.CallableContext) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { symbol, quantity, price, type, portfolioId } = data;

  // Basic validation
  if (!symbol || !quantity || !price || !type || !portfolioId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Get the portfolio
    const portfolioDoc = await admin.firestore().collection('portfolios').doc(portfolioId).get();
    
    if (!portfolioDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Portfolio not found');
    }

    const portfolio = portfolioDoc.data()!;

    // Check if user has permission to trade on this portfolio
    if (portfolio.userId !== context.auth.uid) {
      const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
      const userData = userDoc.data()!;

      if (userData.role !== 'broker-junior' && userData.role !== 'broker-senior' && userData.role !== 'super-admin') {
        throw new functions.https.HttpsError('permission-denied', 'User does not have permission to trade on this portfolio');
      }

      if (userData.brokerageId !== portfolio.brokerageId) {
        throw new functions.https.HttpsError('permission-denied', 'Broker cannot trade on portfolios from other brokerages');
      }
    }

    // Add your trade validation logic here
    // For example: check if there's enough balance for buy orders
    if (type === 'BUY') {
      const totalCost = quantity * price;
      if (portfolio.balance.available < totalCost) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient funds');
      }
    }
    // For sell orders, check if there are enough shares
    else if (type === 'SELL') {
      const holdings = portfolio.holdings[symbol] || { quantity: 0 };
      if (holdings.quantity < quantity) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient shares');
      }
    }

    return {
      isValid: true,
      message: 'Trade validation successful',
      trade: { symbol, quantity, price, type, portfolioId }
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred');
  }
}); 
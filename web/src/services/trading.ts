import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  updateDoc,
  runTransaction,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StockTransaction, UserPortfolio, UserDocument } from "@/types/trading";

const calculateTotalValue = (balance: number, holdings: Record<string, any>): number => {
  const holdingsValue = Object.entries(holdings || {}).reduce((total, [_, holding]) => {
    return total + (holding.quantity * holding.averagePrice);
  }, 0);
  return balance + holdingsValue;
};

export const tradingService = {
  // Create a new stock transaction
  async createTransaction(
    userId: string,
    ticker: string,
    quantity: number,
    price: number,
    type: 'buy' | 'sell'
  ): Promise<StockTransaction> {
    const portfolioRef = doc(db, "portfolios", userId);
    const transactionRef = doc(collection(db, "transactions"));

    // Run everything in a transaction to ensure data consistency
    await runTransaction(db, async (transaction) => {
      const portfolioDoc = await transaction.get(portfolioRef);
      if (!portfolioDoc.exists()) {
        throw new Error("Portfolio not found");
      }

      const portfolio = portfolioDoc.data();
      const totalCost = quantity * price;

      if (type === 'buy') {
        // Check if user has enough balance for the purchase
        if (portfolio.balance < totalCost) {
          throw new Error(`Insufficient balance. Required: $${totalCost.toFixed(2)}, Available: $${portfolio.balance.toFixed(2)}`);
        }

        // Calculate new holdings state
        const newHoldings = { ...portfolio.holdings };
        const currentHolding = newHoldings[ticker] || { quantity: 0, averagePrice: 0 };
        const newQuantity = (currentHolding.quantity || 0) + quantity;
        const newAveragePrice = currentHolding.quantity 
          ? ((currentHolding.quantity * currentHolding.averagePrice) + (quantity * price)) / newQuantity
          : price;

        newHoldings[ticker] = {
          quantity: newQuantity,
          averagePrice: newAveragePrice,
          lastUpdated: Timestamp.fromDate(new Date()),
        };

        // Calculate new balance and total value
        const newBalance = portfolio.balance - totalCost;
        const newTotalValue = calculateTotalValue(newBalance, newHoldings);

        // Update portfolio
        transaction.update(portfolioRef, {
          balance: newBalance,
          holdings: newHoldings,
          totalValue: newTotalValue,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      } else {
        // Check if user has enough shares to sell
        const currentHolding = portfolio.holdings?.[ticker];
        if (!currentHolding || currentHolding.quantity < quantity) {
          throw new Error(`Insufficient shares. Required: ${quantity}, Available: ${currentHolding?.quantity || 0}`);
        }

        // Calculate new holdings state
        const newHoldings = { ...portfolio.holdings };
        const newQuantity = currentHolding.quantity - quantity;
        
        if (newQuantity === 0) {
          delete newHoldings[ticker];
        } else {
          newHoldings[ticker] = {
            quantity: newQuantity,
            averagePrice: currentHolding.averagePrice,
            lastUpdated: Timestamp.fromDate(new Date()),
          };
        }

        // Calculate new balance and total value
        const newBalance = portfolio.balance + totalCost;
        const newTotalValue = calculateTotalValue(newBalance, newHoldings);

        // Update portfolio
        transaction.update(portfolioRef, {
          balance: newBalance,
          holdings: newHoldings,
          totalValue: newTotalValue,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }

      // Create the transaction record
      const now = Timestamp.now();
      const stockTransaction: StockTransaction = {
        id: transactionRef.id,
        userId,
        ticker,
        quantity,
        price,
        type,
        status: 'completed',
        createdAt: now,
        updatedAt: now,
      };

      transaction.set(transactionRef, stockTransaction);
    });

    const now = Timestamp.now();
    // Return the transaction data
    return {
      id: transactionRef.id,
      userId,
      ticker,
      quantity,
      price,
      type,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
    };
  },

  // Store a new document
  async storeDocument(
    userId: string,
    documentData: Omit<UserDocument, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<UserDocument> {
    const docRef = doc(collection(db, "user_documents"));
    
    const newDocument: UserDocument = {
      id: docRef.id,
      userId,
      ...documentData,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    await setDoc(docRef, newDocument);
    return newDocument;
  },

  // Get user's portfolio
  async getPortfolio(userId: string): Promise<UserPortfolio | null> {
    const portfolioDoc = await getDoc(doc(db, "portfolios", userId));
    if (!portfolioDoc.exists()) return null;

    const portfolio = portfolioDoc.data() as UserPortfolio;
    
    // Recalculate total value to ensure it's accurate
    const totalValue = calculateTotalValue(portfolio.balance, portfolio.holdings);
    
    // If total value has changed, update it
    if (totalValue !== portfolio.totalValue) {
      await updateDoc(doc(db, "portfolios", userId), {
        totalValue,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    }

    return {
      ...portfolio,
      totalValue,
    };
  },

  // Get user's documents
  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    try {
      // Basic query with just userId
      const documentsSnapshot = await getDocs(
        query(
          collection(db, "user_documents"),
          where("userId", "==", userId)
        )
      );
      
      return documentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          description: data.description,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as UserDocument;
      });
    } catch (err) {
      console.error('Error fetching documents:', err);
      return [];
    }
  },
}; 
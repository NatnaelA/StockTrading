import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Get the service account configuration
const serviceAccount = functions.config().service?.account;
console.log('Service account configuration:', serviceAccount || 'Using default application credentials');

// Check if app is already initialized to prevent duplicate initialization
if (admin.apps.length === 0) {
  // Initialize the app with the configured service account
  // For Firebase Functions, we should use applicationDefault() which will use the function's identity
  try {
    console.log('Initializing Firebase Admin with application default credentials');
    admin.initializeApp();
    console.log('Firebase Admin initialized successfully with project ID:', admin.app().options.projectId);
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

/**
 * Scheduled function that runs daily to capture portfolio values
 * and store them in the portfolio_history collection
 */
// Commenting out the scheduled function for now
/*
export const capturePortfolioHistory = functions.pubsub
  .schedule('0 0 * * *') // Run at midnight every day (UTC)
  .timeZone('America/New_York') // Adjust to your preferred timezone
  .onRun(async (context) => {
    try {
      const portfoliosSnapshot = await admin.firestore().collection('portfolios').get();
      
      if (portfoliosSnapshot.empty) {
        console.log('No portfolios found');
        return null;
      }

      const batch = admin.firestore().batch();
      const timestamp = admin.firestore.Timestamp.now();
      const date = new Date();
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      console.log(`Capturing portfolio history for ${portfoliosSnapshot.size} portfolios on ${dateString}`);

      for (const portfolioDoc of portfoliosSnapshot.docs) {
        const portfolio = portfolioDoc.data();
        const portfolioId = portfolioDoc.id;
        const userId = portfolio.userId;

        // Skip if portfolio doesn't have required data
        if (!portfolioId || !userId || typeof portfolio.totalValue !== 'number') {
          console.log(`Skipping portfolio ${portfolioId} due to missing data`);
          continue;
        }

        // Format holdings for storage
        const holdings: Record<string, { quantity: number; value: number }> = {};
        
        if (portfolio.holdings && typeof portfolio.holdings === 'object') {
          Object.entries(portfolio.holdings).forEach(([ticker, holdingData]: [string, any]) => {
            if (holdingData && typeof holdingData.quantity === 'number') {
              const quantity = holdingData.quantity;
              const price = holdingData.currentPrice || holdingData.averagePrice || 0;
              holdings[ticker] = {
                quantity,
                value: quantity * price
              };
            }
          });
        }

        // Create a unique ID for the history entry using date and portfolio ID
        const historyId = `${portfolioId}_${dateString}`;
        
        // Create the history entry
        const historyEntry = {
          portfolioId,
          userId,
          timestamp,
          totalValue: portfolio.totalValue || 0,
          balance: portfolio.balance || 0,
          holdings,
          createdAt: timestamp
        };

        // Add to batch
        batch.set(
          admin.firestore().collection('portfolio_history').doc(historyId),
          historyEntry,
          { merge: true } // Use merge to update if entry already exists
        );
      }

      // Commit the batch
      await batch.commit();
      console.log(`Successfully captured portfolio history for ${portfoliosSnapshot.size} portfolios`);
      return null;
    } catch (error) {
      console.error('Error capturing portfolio history:', error);
      return null;
    }
  });
*/

/**
 * Function to manually trigger portfolio history capture
 * This can be called via an HTTP request for testing or manual updates
 */
export const manualCapturePortfolioHistory = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    console.log('Authentication error: User not authenticated');
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  console.log('manualCapturePortfolioHistory called with data:', JSON.stringify(data));
  console.log('User ID:', context.auth.uid);

  try {
    // Get user document to check permissions
    console.log('Fetching user document for:', context.auth.uid);
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    
    if (!userDoc.exists) {
      console.log('User document not found for:', context.auth.uid);
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data()!;
    console.log('User data:', JSON.stringify(userData));
    
    // Only allow admins or the specific portfolio owner to trigger this
    const isAdmin = userData.role === 'super_admin';
    const portfolioId = data?.portfolioId;
    
    console.log('Is admin:', isAdmin);
    console.log('Portfolio ID:', portfolioId);
    
    if (!isAdmin && (!portfolioId || data.forceAll)) {
      console.log('Permission denied: Not admin and trying to capture all portfolios');
      throw new functions.https.HttpsError(
        'permission-denied', 
        'Only admins can capture history for all portfolios'
      );
    }

    // If a specific portfolio ID is provided, only capture that one
    if (portfolioId && !data.forceAll) {
      console.log('Fetching portfolio document for:', portfolioId);
      const portfolioDoc = await admin.firestore().collection('portfolios').doc(portfolioId).get();
      
      if (!portfolioDoc.exists) {
        console.log('Portfolio not found:', portfolioId);
        throw new functions.https.HttpsError('not-found', 'Portfolio not found');
      }
      
      const portfolio = portfolioDoc.data()!;
      console.log('Portfolio data:', JSON.stringify({
        id: portfolioId,
        userId: portfolio.userId,
        totalValue: portfolio.totalValue,
        balance: portfolio.balance,
        holdingsCount: portfolio.holdings ? Object.keys(portfolio.holdings).length : 0
      }));
      
      // Check if user has permission for this portfolio
      if (!isAdmin && portfolio.userId !== context.auth.uid) {
        console.log('Permission denied: User does not own this portfolio');
        console.log('Portfolio userId:', portfolio.userId);
        console.log('Auth userId:', context.auth.uid);
        throw new functions.https.HttpsError(
          'permission-denied', 
          'You do not have permission to capture history for this portfolio'
        );
      }
      
      const timestamp = admin.firestore.Timestamp.now();
      const date = new Date();
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Format holdings for storage
      const holdings: Record<string, { quantity: number; value: number }> = {};
      
      if (portfolio.holdings && typeof portfolio.holdings === 'object') {
        console.log('Processing portfolio holdings');
        Object.entries(portfolio.holdings).forEach(([ticker, holdingData]: [string, any]) => {
          if (holdingData && typeof holdingData.quantity === 'number') {
            const quantity = holdingData.quantity;
            const price = holdingData.currentPrice || holdingData.averagePrice || 0;
            holdings[ticker] = {
              quantity,
              value: quantity * price
            };
            console.log(`Processed holding: ${ticker}, quantity: ${quantity}, price: ${price}`);
          } else {
            console.log(`Skipping invalid holding: ${ticker}`, holdingData);
          }
        });
      } else {
        console.log('No holdings found or holdings is not an object');
      }
      
      // Create a unique ID for the history entry using date and portfolio ID
      const historyId = `${portfolioId}_${dateString}`;
      console.log('Creating history entry with ID:', historyId);
      
      // Create the history entry
      const historyEntry = {
        portfolioId,
        userId: portfolio.userId,
        timestamp,
        totalValue: portfolio.totalValue || 0,
        balance: portfolio.balance || 0,
        holdings,
        createdAt: timestamp
      };
      
      // Save the history entry
      console.log('Saving history entry to Firestore');
      await admin.firestore().collection('portfolio_history').doc(historyId).set(historyEntry, { merge: true });
      console.log('History entry saved successfully');
      
      return {
        success: true,
        message: `Successfully captured history for portfolio ${portfolioId}`,
        timestamp: dateString
      };
    } else {
      // For admins who want to capture all portfolios
      // This is similar to the scheduled function logic
      const portfoliosSnapshot = await admin.firestore().collection('portfolios').get();
      
      if (portfoliosSnapshot.empty) {
        return {
          success: true,
          message: 'No portfolios found to capture',
          count: 0
        };
      }
      
      const batch = admin.firestore().batch();
      const timestamp = admin.firestore.Timestamp.now();
      const date = new Date();
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      let count = 0;
      
      for (const portfolioDoc of portfoliosSnapshot.docs) {
        const portfolio = portfolioDoc.data();
        const portfolioId = portfolioDoc.id;
        const userId = portfolio.userId;
        
        // Skip if portfolio doesn't have required data
        if (!portfolioId || !userId || typeof portfolio.totalValue !== 'number') {
          continue;
        }
        
        // Format holdings for storage
        const holdings: Record<string, { quantity: number; value: number }> = {};
        
        if (portfolio.holdings && typeof portfolio.holdings === 'object') {
          Object.entries(portfolio.holdings).forEach(([ticker, holdingData]: [string, any]) => {
            if (holdingData && typeof holdingData.quantity === 'number') {
              const quantity = holdingData.quantity;
              const price = holdingData.currentPrice || holdingData.averagePrice || 0;
              holdings[ticker] = {
                quantity,
                value: quantity * price
              };
            }
          });
        }
        
        // Create a unique ID for the history entry using date and portfolio ID
        const historyId = `${portfolioId}_${dateString}`;
        
        // Create the history entry
        const historyEntry = {
          portfolioId,
          userId,
          timestamp,
          totalValue: portfolio.totalValue || 0,
          balance: portfolio.balance || 0,
          holdings,
          createdAt: timestamp
        };
        
        // Add to batch
        batch.set(
          admin.firestore().collection('portfolio_history').doc(historyId),
          historyEntry,
          { merge: true }
        );
        
        count++;
      }
      
      // Commit the batch
      await batch.commit();
      
      return {
        success: true,
        message: `Successfully captured history for ${count} portfolios`,
        count,
        timestamp: dateString
      };
    }
  } catch (error) {
    console.error('Error in manual portfolio history capture:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
}); 
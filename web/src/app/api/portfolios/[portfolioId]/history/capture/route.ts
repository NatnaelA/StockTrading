import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { portfolioId: string } }
) {
  try {
    // Get the session cookie from the request
    const sessionCookie = cookies().get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: No session cookie' },
        { status: 401 }
      );
    }

    // Get admin instances
    const auth = await getAdminAuth();
    const db = await getAdminDb();

    // Verify the session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Invalid session' },
        { status: 401 }
      );
    }

    // Get the portfolio ID from the URL params
    const portfolioId = params.portfolioId;
    
    if (!portfolioId) {
      return NextResponse.json(
        { success: false, message: 'Missing portfolio ID' },
        { status: 400 }
      );
    }

    console.log(`Server: Capturing history for portfolio ${portfolioId} by user ${userId}`);

    // Check if the user is authorized to access this portfolio
    const portfolioDoc = await db.collection('portfolios').doc(portfolioId).get();
    
    if (!portfolioDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Portfolio not found' },
        { status: 404 }
      );
    }

    const portfolioData = portfolioDoc.data();
    
    // Ensure the user owns this portfolio or has admin rights
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const isAdmin = userData?.role === 'super_admin';
    
    if (!isAdmin && portfolioData?.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You do not have permission to capture history for this portfolio' },
        { status: 403 }
      );
    }

    // Capture the portfolio history
    const timestamp = new Date();
    const dateString = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Format holdings for storage
    const holdings = {};
    
    if (portfolioData?.holdings && typeof portfolioData.holdings === 'object') {
      Object.entries(portfolioData.holdings).forEach(([ticker, holdingData]: [string, any]) => {
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
      userId: portfolioData.userId,
      timestamp,
      totalValue: portfolioData.totalValue || 0,
      balance: portfolioData.balance || 0,
      holdings,
      createdAt: timestamp
    };
    
    // Save the history entry
    await db.collection('portfolio_history').doc(historyId).set(historyEntry, { merge: true });
    
    return NextResponse.json({
      success: true,
      message: `Successfully captured history for portfolio ${portfolioId}`,
      timestamp: dateString
    });
  } catch (error) {
    console.error('Server: Error capturing portfolio history:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to capture portfolio history',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
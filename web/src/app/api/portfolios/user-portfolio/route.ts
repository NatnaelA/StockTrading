import { NextRequest, NextResponse } from 'next/server';
// Use the consistent createClient based on @supabase/ssr
import { createClient } from '@/lib/supabase-server';
// import { createServerSupabaseClient } from '@/lib/supabase-server'; // Old import

// Define the Holding type expected by the frontend
// Ensure this matches the type used in HoldingsList.tsx
interface Holding {
  symbol: string;
  quantity: number;
  currentPrice: number;
  previousClose: number;
}

/**
 * Get portfolio and profile data for the authenticated user
 * @route GET /api/portfolios/user-portfolio
 */
export async function GET(request: NextRequest) {
  console.log('[API /portfolios/user-portfolio] Received request');
  try {
    // Use the consistent async createClient based on @supabase/ssr
    const supabase = await createClient();
    
    // Get the current authenticated user securely
    console.log('[API /portfolios/user-portfolio] Fetching user data');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[API /portfolios/user-portfolio] Auth error:', authError.message);
      // Don't expose detailed auth errors usually, return a generic unauthorized
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Authentication failed' }, 
        { status: 401 }
      );
    }
    
    if (!user) {
      console.log('[API /portfolios/user-portfolio] No authenticated user found');
      return NextResponse.json(
        { success: false, message: 'Unauthorized: No valid session' },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log(`[API /portfolios/user-portfolio] Authenticated user ID: ${userId}`);

    // Fetch the user's profile data
    console.log(`[API /portfolios/user-portfolio] Fetching profile for user: ${userId}`);
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, profile_completed') // Select specific fields needed
      .eq('id', userId)
      .single(); // Profile MUST exist if user is authenticated

    if (profileError || !profile) {
        console.error(`[API /portfolios/user-portfolio] Error fetching profile for user ${userId}:`, profileError);
        // If profile doesn't exist here, something is very wrong with the auth/user creation flow
        return NextResponse.json({
          success: false,
          message: 'Database error fetching user profile',
          error: profileError?.message || 'User profile not found'
        }, { status: 500 });
    }
    console.log(`[API /portfolios/user-portfolio] Profile found for user ${userId}, completed: ${profile.profile_completed}`);

    // Fetch the user's portfolio (only fetch, do not create)
    console.log(`[API /portfolios/user-portfolio] Fetching portfolio for user: ${userId}`);
    const { data: portfolio, error: portfolioQueryError } = await supabase
      .from('portfolios')
      .select('*') // Select all columns for consistency
      .eq('user_id', userId)
      // .order('created_at', { ascending: false }) // Ordering might not be needed if user has only one
      .maybeSingle(); // Use maybeSingle() to return null if not found, instead of erroring
    
    // Handle potential database errors during fetch
    if (portfolioQueryError) {
        console.error(`[API /portfolios/user-portfolio] Error fetching portfolio for user ${userId}:`, portfolioQueryError);
        return NextResponse.json({
          success: false,
          message: 'Database error fetching portfolio',
          error: portfolioQueryError.message
        }, { status: 500 });
    }
    
    // If portfolio is null (doesn't exist), return null in the response
    if (!portfolio) {
        console.log(`[API /portfolios/user-portfolio] No portfolio found for user ${userId}`);
        // If profile is complete but no portfolio, that might be an error state?
        // Or maybe allow manual creation later. For now, return null.
        return NextResponse.json({
          success: true,
          profile, // Return profile even if portfolio is null
          portfolio: null // Explicitly return null
        });
    }

    // Portfolio found, return it along with profile
    console.log(`[API /portfolios/user-portfolio] Portfolio found for user ${userId}, ID: ${portfolio.id}`);

    // --- START: Formatting holdings --- 
    let formattedHoldings: Holding[] = [];
    const rawHoldings = portfolio.holdings || {}; // e.g., {"AAPL": 10, "GOOGL": 5}
    const symbols = Object.keys(rawHoldings);

    if (symbols.length > 0) {
        console.log(`[API /portfolios/user-portfolio] Found symbols in raw holdings: ${symbols.join(', ')}`);
        
        // Fetch stock data for these symbols
        const { data: stocksData, error: stocksError } = await supabase
            .from('stocks')
            .select('symbol, current_price, day_change')
            .in('symbol', symbols);

        if (stocksError) {
            console.error(`[API /portfolios/user-portfolio] Error fetching stock data for symbols: ${symbols.join(', ')}`, stocksError);
            // Proceed without price data? Or return error? For now, proceed but holdings might lack prices.
        } else if (stocksData) {
            console.log(`[API /portfolios/user-portfolio] Fetched stock data for ${stocksData.length} symbols.`);
            const stocksMap = new Map(stocksData.map(stock => [stock.symbol, stock]));

            // Combine raw holdings quantity with fetched stock data
            formattedHoldings = symbols.map(symbol => {
                const quantity = rawHoldings[symbol]; // Get quantity from raw holdings
                const stockInfo = stocksMap.get(symbol);
                const currentPrice = stockInfo?.current_price ?? 0;
                const dayChange = stockInfo?.day_change ?? 0;
                const previousClose = currentPrice - dayChange; // Calculate previous close
                
                return {
                    symbol,
                    quantity,
                    currentPrice,
                    previousClose,
                };
            });
            console.log(`[API /portfolios/user-portfolio] Formatted holdings:`, formattedHoldings);
        } else {
             console.log(`[API /portfolios/user-portfolio] No stock data found for symbols: ${symbols.join(', ')}`);
        }
    } else {
        console.log(`[API /portfolios/user-portfolio] No symbols found in raw holdings object.`);
    }
    // --- END: Formatting holdings --- 

    // Construct the final portfolio object with formatted holdings
    const finalPortfolio = {
        ...portfolio,
        holdings: formattedHoldings // Replace raw holdings object with formatted array
    };

    return NextResponse.json({
      success: true,
      profile, // Add profile to the response
      portfolio: finalPortfolio // Return the portfolio with formatted holdings
    });

  } catch (error) {
    console.error('[API /portfolios/user-portfolio] Unexpected error in handler:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch portfolio due to an unexpected error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
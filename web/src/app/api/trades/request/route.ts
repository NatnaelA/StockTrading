import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    // Use the consistent async createClient based on @supabase/ssr
    const supabase = await createClient();
    
    // Get the current authenticated user
    // Prefer getUser() over getSession() for server-side
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[API /trades/request] Auth Error:', authError?.message || 'No user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = user.id;
    const data = await request.json();
    const {
      symbol,
      quantity,
      orderType,
      side,
      limitPrice,
      portfolioId,
      notes,
    } = data;

    // Validate required fields
    if (!symbol || !quantity || !orderType || !side) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine the target portfolio ID
    let actualPortfolioId = portfolioId;

    // If no portfolioId provided, fetch the user's default/primary one
    if (!actualPortfolioId) {
      const { data: defaultPortfolio, error: findError } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) {
        console.error('[API /trades/request] Error fetching default portfolio:', findError);
        return NextResponse.json({ error: 'Failed to retrieve portfolio' }, { status: 500 });
      }
      if (!defaultPortfolio) {
        console.error('[API /trades/request] No portfolio found for user:', userId);
        return NextResponse.json({ error: 'No portfolio found. Complete profile first.' }, { status: 404 });
      }
      actualPortfolioId = defaultPortfolio.id;
      console.log(`[API /trades/request] No portfolioId provided, using latest: ${actualPortfolioId}`);
    }

    // Verify the portfolio exists and belongs to the user
    const { data: portfolio, error: portfolioCheckError } = await supabase
      .from('portfolios')
      .select('*') // Select necessary fields like balance, holdings
      .eq('id', actualPortfolioId)
      .eq('user_id', userId)
      .single();

    if (portfolioCheckError || !portfolio) {
      console.error('[API /trades/request] Portfolio check failed or not found:', { id: actualPortfolioId, userId, error: portfolioCheckError });
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    console.log(`[API /trades/request] Verified portfolio access for ID: ${actualPortfolioId}`);

    // Verify sufficient funds or shares for the trade
    if (side === 'buy') {
      // Check if stock data is available
      const { data: stockData, error: stockError } = await supabase
        .from('stocks')
        .select('current_price')
        .eq('symbol', symbol)
        .single();
        
      if (stockError) {
        // For now, we'll use a placeholder price if stock data isn't available
        // In a real app, you'd want to fetch this from an external API
        const estimatedPrice = limitPrice || 100; // Use limit price if provided, otherwise placeholder
        const estimatedCost = quantity * estimatedPrice;
        
        if (portfolio.balance < estimatedCost) {
          return NextResponse.json(
            { error: 'Insufficient funds for this purchase' },
            { status: 400 }
          );
        }
      } else {
        const estimatedCost = quantity * stockData.current_price;
        if (portfolio.balance < estimatedCost) {
          return NextResponse.json(
            { error: 'Insufficient funds for this purchase' },
            { status: 400 }
          );
        }
      }
    } else if (side === 'sell') {
      // Check if user has enough shares
      const holdings = portfolio.holdings || {};
      const currentHolding = holdings[symbol] || 0;
      
      if (currentHolding < quantity) {
        return NextResponse.json(
          { error: `Insufficient shares of ${symbol} for this sale` },
          { status: 400 }
        );
      }
    }

    // --- Insert into TRANSACTIONS table --- 
    console.log(`[API /trades/request] Inserting into transactions table for portfolio ${actualPortfolioId}`);
    
    // ** Important: Assume 'price' is sent in the request body or determined beforehand **
    // If not, this needs adjustment (e.g., fetch quote here or require client to send)
    const executionPrice = data.price || limitPrice; // Use provided price or limit price as fallback?
    if (!executionPrice) {
      // Handle cases where price is crucial and missing
      // For market orders, price might be determined upon execution
      // For now, let's error if no price indication is available.
       console.error('[API /trades/request] Execution price is missing.');
       return NextResponse.json({ error: 'Execution price not provided or determined.' }, { status: 400 });
    }
    const totalAmount = quantity * executionPrice;

    const { data: transactionDataArray, error: transactionError } = await supabase
      .from('transactions') // Target transactions table
      .insert({
        // Map fields to transactions table columns
        portfolio_id: actualPortfolioId,
        user_id: userId,
        stock_symbol: symbol,
        quantity: quantity,
        price: executionPrice,
        type: side.toUpperCase(), // Map 'buy'/'sell' to 'BUY'/'SELL'
        fee: 0, // Assuming fee calculation happens later or is 0 for now
        total_amount: totalAmount, 
        date: new Date().toISOString(),
        status: 'PENDING', // Trades start as pending
        notes: notes || `${side.toUpperCase()} ${quantity} of ${symbol}`, // Use provided notes or generate default
      })
      .select() // Select the inserted row to get its ID
      // Remove .single() as insert returns an array
      
    if (transactionError || !transactionDataArray || transactionDataArray.length === 0) {
      console.error('Error creating transaction record:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create transaction record' },
        { status: 500 }
      );
    }
    
    // Get the ID of the inserted transaction
    const transaction = transactionDataArray[0];
    console.log(`[API /trades/request] Transaction record created with ID: ${transaction.id}`);

    // --- Ensure stock exists in the stocks table --- 
    try {
      console.log(`[API /trades/request] Checking/Upserting stock symbol: ${symbol}`);
      // We need current stock info to insert/update
      // This might require calling Alpha Vantage or your quote provider here
      // For now, we'll just ensure the basic entry exists if possible, 
      // assuming price updates happen elsewhere.
      // Ideally, fetch name/exchange here too.
      const { error: stockUpsertError } = await supabase
        .from('stocks')
        .upsert({ 
            symbol: symbol, 
            name: symbol, // Placeholder: Replace with actual name fetched from provider
            exchange: 'NASDAQ', // Placeholder: Replace with actual exchange
            // current_price: executionPrice, // Optionally update price here too?
            last_updated: new Date().toISOString()
          }, 
          { onConflict: 'symbol' } // If symbol exists, update last_updated (or other fields)
        );

      if (stockUpsertError) {
        // Log error but don't fail the whole trade request
        console.error(`[API /trades/request] Error upserting stock ${symbol}:`, stockUpsertError);
      }
    } catch (stockError) {
        console.error(`[API /trades/request] Exception during stock upsert for ${symbol}:`, stockError);
    }
    // ---------------------------------------------

    // Create audit log referencing the transaction
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        action: 'TRADE_REQUEST_CREATED',
        transaction_id: transaction.id, // Reference transaction_id
        portfolio_id: actualPortfolioId,
        user_id: userId,
        details: {
          symbol,
          quantity,
          orderType, // Keep original order type in details if needed
          side,
          limitPrice, // Keep limit price in details if needed
          status: 'PENDING',
          price: executionPrice, // Log the price used
        },
        timestamp: new Date().toISOString(),
      });
      
    if (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the request if audit log fails
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id, // Return transactionId
      portfolioId: actualPortfolioId,
      message: 'Trade request submitted successfully as pending transaction',
    });
  } catch (error) {
    console.error('Error creating trade request:', error);
    return NextResponse.json(
      { error: 'Failed to create trade request' },
      { status: 500 }
    );
  }
} 
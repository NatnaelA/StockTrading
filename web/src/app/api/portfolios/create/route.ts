import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  console.log('[API /portfolios/create] Received request');
  try {
    // Create a Supabase client with cookie-based auth - first try with createServerSupabaseClient
    console.log('[API /portfolios/create] Creating Supabase client');
    let supabase;
    
    try {
      supabase = createServerSupabaseClient();
    } catch (error) {
      console.error('[API /portfolios/create] Error with createServerSupabaseClient:', error);
      console.log('[API /portfolios/create] Falling back to createClient');
      supabase = await createClient();
    }

    // Check for cookies
    if (request.headers.has('cookie')) {
      console.log('[API /portfolios/create] Request includes cookies:', request.headers.get('cookie'));
    } else {
      console.log('[API /portfolios/create] No cookies in request');
    }
    
    // Get the current authenticated user
    console.log('[API /portfolios/create] Fetching session');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('[API /portfolios/create] Auth error:', authError.message);
      return NextResponse.json(
        { success: false, message: 'Authentication error', error: authError.message },
        { status: 500 }
      );
    }

    if (!authData.session) {
      console.log('[API /portfolios/create] No session found, returning 401');
      return NextResponse.json(
        { success: false, message: 'Unauthorized: No session' },
        { status: 401 }
      );
    }

    const userId = authData.session.user.id;
    console.log(`[API /portfolios/create] Authenticated user ID: ${userId}`);
    
    // Check if user already has a portfolio to avoid duplicates
    console.log(`[API /portfolios/create] Checking for existing portfolio for user: ${userId}`);
    const { data: existingPortfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id, name, balance')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: row not found, which is ok
      console.error('[API /portfolios/create] Error fetching existing portfolio:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Database error checking portfolio', error: fetchError.message },
        { status: 500 }
      );
    }
      
    if (existingPortfolio) {
      console.log(`[API /portfolios/create] Portfolio already exists for user ${userId}, ID: ${existingPortfolio.id}`);
      // Just return the existing portfolio
      return NextResponse.json({
        success: true,
        message: 'Portfolio already exists',
        portfolio: existingPortfolio
      });
    }
    
    console.log(`[API /portfolios/create] No existing portfolio found for user ${userId}. Proceeding to create.`);
    // Get details for new portfolio from the request body
    let requestData;
    try {
      requestData = await request.json();
      console.log('[API /portfolios/create] Parsed request body:', requestData);
    } catch (parseError) {
      console.error('[API /portfolios/create] Error parsing request body:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid request body', error: parseError instanceof Error ? parseError.message : 'Unknown parsing error' },
        { status: 400 }
      );
    }

    const portfolioName = requestData.name || 'My Portfolio';
    const initialBalance = requestData.initialBalance || 10000; // Default $10,000
    console.log(`[API /portfolios/create] Creating new portfolio with name: '${portfolioName}', balance: ${initialBalance}`);
    
    // Create a new portfolio
    const { data: newPortfolio, error: createError } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: portfolioName,
        balance: initialBalance,
        holdings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (createError) {
      console.error('[API /portfolios/create] Error creating portfolio in database:', createError);
      return NextResponse.json(
        { success: false, message: 'Failed to create portfolio', error: createError.message },
        { status: 500 }
      );
    }
    
    console.log(`[API /portfolios/create] Portfolio created successfully for user ${userId}, ID: ${newPortfolio.id}`);
    return NextResponse.json({
      success: true,
      message: 'Portfolio created successfully',
      portfolio: newPortfolio
    });
  } catch (error) {
    console.error('[API /portfolios/create] Unexpected error in handler:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
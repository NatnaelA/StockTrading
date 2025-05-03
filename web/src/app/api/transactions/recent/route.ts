import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

/**
 * Get recent transactions for the authenticated user
 * @route GET /api/transactions/recent
 */
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/transactions/recent - Request received');

    // Check if cookies are available
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    console.log('Available cookies:', allCookies.map(c => c.name));
    
    // Use the consistent async createClient based on @supabase/ssr
    const supabase = await createClient();

    // Get the current authenticated user
    console.log('Attempting to get Supabase session');
    const { data: authData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Supabase session error:', sessionError);
      return NextResponse.json(
        { success: false, message: 'Session error: ' + sessionError.message },
        { status: 401 }
      );
    }
    
    if (!authData.session) {
      console.error('No Supabase session found');
      return NextResponse.json(
        { success: false, message: 'Unauthorized: No session' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', authData.session.user.id);
    const userId = authData.session.user.id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    console.log('Query params:', { portfolioId, limit });

    // If a specific portfolio is requested, verify it exists and belongs to the user
    if (portfolioId) {
      console.log('Checking portfolio access for ID:', portfolioId);
      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .select('id')
        .eq('id', portfolioId)
        .eq('user_id', userId)
        .single();
        
      // If portfolio doesn't exist or doesn't belong to the user, return empty results
      // instead of an error to gracefully handle missing portfolios
      if (error || !portfolio) {
        console.log('Portfolio not found or not accessible:', error?.message);
        return NextResponse.json({ 
          success: true, 
          transactions: [],
          message: 'No portfolio found with the specified ID'
        });
      }
      console.log('Portfolio access granted');
    }

    // Build query based on parameters
    console.log('Building transactions query for user:', userId);
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
      
    if (portfolioId) {
      query = query.eq('portfolio_id', portfolioId);
    }

    // Execute query
    console.log('Executing transactions query');
    const { data: transactions, error } = await query;
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    console.log(`Successfully retrieved ${transactions?.length || 0} transactions`);
    return NextResponse.json({ 
      success: true, 
      transactions: transactions || [] 
    });
  } catch (error) {
    console.error('Error in recent transactions API:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
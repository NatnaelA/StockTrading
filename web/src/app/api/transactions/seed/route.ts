import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Create a Supabase client
    const supabase = createServerSupabaseClient();
    
    // Get the current authenticated user
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: No session' },
        { status: 401 }
      );
    }

    const userId = authData.session.user.id;

    // Get the user's existing portfolio. Seeding should only work if a portfolio exists.
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id') // Only need the ID
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle as portfolio might not exist

    if (portfolioError) {
      console.error('[API /transactions/seed] Error fetching portfolio:', portfolioError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch portfolio information' },
        { status: 500 }
      );
    }

    if (!portfolioData) {
      // If no portfolio exists, seeding cannot proceed.
      console.log(`[API /transactions/seed] No portfolio found for user ${userId}. Seeding aborted.`);
      return NextResponse.json(
        { success: false, message: 'Portfolio not found. Cannot seed transactions.' },
        { status: 404 } // Or 400 Bad Request
      );
    }

    const portfolioId = portfolioData.id;
    console.log(`[API /transactions/seed] Using portfolio ID: ${portfolioId} for seeding.`);
    
    // Sample transactions
    const sampleTransactions = [
      {
        user_id: userId,
        portfolio_id: portfolioId,
        symbol: 'AAPL',
        quantity: 5,
        price: 182.63,
        type: 'buy',
        status: 'completed',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: userId,
        portfolio_id: portfolioId,
        symbol: 'MSFT',
        quantity: 3,
        price: 380.89,
        type: 'buy',
        status: 'completed',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: userId,
        portfolio_id: portfolioId,
        symbol: 'AAPL',
        quantity: 2,
        price: 184.95,
        type: 'buy',
        status: 'completed',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: userId,
        portfolio_id: portfolioId,
        symbol: 'TSLA',
        quantity: 4,
        price: 189.98,
        type: 'buy',
        status: 'completed',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: userId,
        portfolio_id: portfolioId,
        symbol: 'MSFT',
        quantity: 1,
        price: 381.53,
        type: 'sell',
        status: 'completed',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    
    // Insert transactions
    const { data: insertedTransactions, error: insertError } = await supabase
      .from('transactions')
      .insert(sampleTransactions)
      .select();
      
    if (insertError) {
      return NextResponse.json(
        { success: false, message: 'Failed to seed transactions', error: insertError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sample transactions created successfully',
      count: insertedTransactions.length,
      transactionIds: insertedTransactions.map(t => t.id)
    });
  } catch (error) {
    console.error('Error seeding transactions:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred', error: String(error) },
      { status: 500 }
    );
  }
} 
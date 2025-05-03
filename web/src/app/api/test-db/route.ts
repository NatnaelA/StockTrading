import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Create a Supabase client
    const supabase = createServerSupabaseClient();
    
    // Get session information
    const { data: authData, error: sessionError } = await supabase.auth.getSession();

    // Check which tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
      
    // Check for transactions table specifically
    const { count: transactionsCount, error: transactionsError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
      
    // Check for portfolios table specifically
    const { count: portfoliosCount, error: portfoliosError } = await supabase
      .from('portfolios')
      .select('*', { count: 'exact', head: true });
      
    return NextResponse.json({
      session: {
        exists: !!authData.session,
        userId: authData.session?.user?.id,
        error: sessionError?.message
      },
      tables: {
        list: tables || [],
        error: tablesError?.message
      },
      transactions: {
        exists: !transactionsError,
        count: transactionsCount,
        error: transactionsError?.message
      },
      portfolios: {
        exists: !portfoliosError,
        count: portfoliosCount,
        error: portfoliosError?.message
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      error: 'Failed to test database',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
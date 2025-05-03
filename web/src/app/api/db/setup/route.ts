import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * This endpoint checks for required tables and creates them if missing
 * For development use only
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        error: 'This endpoint is not available in production'
      }, { status: 403 });
    }
    
    // Need to use service role key to create tables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing required environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 });
    }
    
    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // Check which tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
      
    if (tablesError) {
      return NextResponse.json({
        error: 'Failed to check tables',
        details: tablesError.message
      }, { status: 500 });
    }
    
    const existingTables = tables?.map((t) => t.tablename) || [];
    console.log('Existing tables:', existingTables);
    
    // Define required tables and create them if missing
    const results: Record<string, any> = {};
    
    // 1. Check for profiles table
    if (!existingTables.includes('profiles')) {
      const { error } = await supabase.rpc('create_profiles_table');
      results.profiles = { created: !error, error: error?.message };
    } else {
      results.profiles = { exists: true };
    }
    
    // 2. Check for portfolios table
    if (!existingTables.includes('portfolios')) {
      const { error } = await supabase.rpc('create_portfolios_table');
      
      if (error) {
        // Try creating manually
        const portfoliosSQL = `
          CREATE TABLE IF NOT EXISTS portfolios (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            balance NUMERIC(15,2) NOT NULL DEFAULT 0,
            holdings JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
          );
          
          ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can view their own portfolios"
            ON portfolios FOR SELECT
            USING (auth.uid() = user_id);
            
          CREATE POLICY "Users can update their own portfolios"
            ON portfolios FOR UPDATE
            USING (auth.uid() = user_id);
            
          CREATE POLICY "Users can insert their own portfolios"
            ON portfolios FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        `;
        
        const { error: manualError } = await supabase.rpc('run_sql', { sql: portfoliosSQL });
        
        results.portfolios = {
          created: !manualError,
          error: manualError ? manualError.message : null,
          manual: true
        };
      } else {
        results.portfolios = { created: true };
      }
    } else {
      results.portfolios = { exists: true };
    }
    
    // 3. Check for transactions table
    if (!existingTables.includes('transactions')) {
      const { error } = await supabase.rpc('create_transactions_table');
      
      if (error) {
        // Try creating manually
        const transactionsSQL = `
          CREATE TABLE IF NOT EXISTS transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
            symbol TEXT NOT NULL,
            quantity NUMERIC(15,6) NOT NULL,
            price NUMERIC(15,2) NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'completed',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
          );
          
          ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can view their own transactions"
            ON transactions FOR SELECT
            USING (auth.uid() = user_id);
            
          CREATE POLICY "Users can insert their own transactions"
            ON transactions FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        `;
        
        const { error: manualError } = await supabase.rpc('run_sql', { sql: transactionsSQL });
        
        results.transactions = {
          created: !manualError,
          error: manualError ? manualError.message : null,
          manual: true
        };
      } else {
        results.transactions = { created: true };
      }
    } else {
      results.transactions = { exists: true };
    }
    
    // 4. Check for trades table
    if (!existingTables.includes('trades')) {
      const { error } = await supabase.rpc('create_trades_table');
      
      if (error) {
        // Try creating manually
        const tradesSQL = `
          CREATE TABLE IF NOT EXISTS trades (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            symbol TEXT NOT NULL,
            quantity NUMERIC(15,6) NOT NULL,
            order_type TEXT NOT NULL,
            side TEXT NOT NULL,
            limit_price NUMERIC(15,2),
            status TEXT NOT NULL,
            portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
            requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
          );
          
          ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can view trades for their portfolios"
            ON trades FOR SELECT
            USING (
              portfolio_id IN (
                SELECT id FROM portfolios WHERE user_id = auth.uid()
              )
            );
            
          CREATE POLICY "Users can insert trades for their portfolios"
            ON trades FOR INSERT
            WITH CHECK (
              requested_by = auth.uid() AND
              portfolio_id IN (
                SELECT id FROM portfolios WHERE user_id = auth.uid()
              )
            );
        `;
        
        const { error: manualError } = await supabase.rpc('run_sql', { sql: tradesSQL });
        
        results.trades = {
          created: !manualError,
          error: manualError ? manualError.message : null,
          manual: true
        };
      } else {
        results.trades = { created: true };
      }
    } else {
      results.trades = { exists: true };
    }
    
    // 5. Check for stocks table
    if (!existingTables.includes('stocks')) {
      const stocksSQL = `
        CREATE TABLE IF NOT EXISTS stocks (
          symbol TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          current_price NUMERIC(15,2),
          day_change NUMERIC(15,2),
          day_change_percentage NUMERIC(15,2),
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Public read access for stocks data
        ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can read stocks data"
          ON stocks FOR SELECT
          USING (true);
      `;
      
      const { error: manualError } = await supabase.rpc('run_sql', { sql: stocksSQL });
      
      results.stocks = {
        created: !manualError,
        error: manualError ? manualError.message : null
      };
    } else {
      results.stocks = { exists: true };
    }
    
    // Get the updated list of tables
    const { data: updatedTables } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
      
    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      tablesBefore: existingTables,
      tablesAfter: updatedTables?.map((t) => t.tablename) || [],
      results
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      error: 'Failed to set up database',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
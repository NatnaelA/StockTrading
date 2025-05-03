import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * This endpoint helps fix authentication problems by directly setting the cookies
 * For development use only
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        error: 'This endpoint is not available in production'
      }, { status: 403 });
    }
    
    // Get required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing required environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 });
    }
    
    // Create admin client for operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // Create a test user email with a timestamp to avoid conflicts
    const timestamp = new Date().getTime();
    const testEmail = `test_${timestamp}@example.com`;
    const testPassword = 'Test123!';
    
    // Create a new user
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true  // Auto-confirm the email
    });
    
    if (createError || !createData.user) {
      return NextResponse.json({
        error: 'Failed to create test user',
        details: createError?.message
      }, { status: 500 });
    }
    
    const user = createData.user;
    
    // Create a regular client to sign in with the new user
    const regularClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Sign in with email and password
    const { data: signInData, error: signInError } = await regularClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError || !signInData.session) {
      return NextResponse.json({
        error: 'Failed to create session',
        details: signInError?.message
      }, { status: 500 });
    }
    
    // Set the cookies manually
    const cookieStore = cookies();
    const session = signInData.session;
    
    // Calculate expiry values safely
    const expiresAt = session.expires_at || Math.floor(Date.now() / 1000) + 3600; // 1 hour from now if not set
    const expiresIn = Math.floor((expiresAt * 1000 - Date.now()) / 1000);
    
    // Set the access token cookie
    cookieStore.set({
      name: `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`,
      value: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: expiresAt,
        expires_in: expiresIn
      }),
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
    
    // Create a portfolio for this user
    const { data: portfolioData, error: portfolioError } = await adminClient
      .from('portfolios')
      .insert({
        user_id: user.id,
        name: 'Default Portfolio',
        balance: 10000,
        holdings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (portfolioError) {
      return NextResponse.json({
        error: 'Failed to create portfolio but auth is fixed',
        details: portfolioError.message,
        user: user,
        session: session
      });
    }
    
    // Add some sample transactions
    const transactions = [
      {
        user_id: user.id,
        portfolio_id: portfolioData.id,
        symbol: 'AAPL',
        quantity: 10,
        price: 180.0,
        type: 'buy',
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: user.id,
        portfolio_id: portfolioData.id,
        symbol: 'MSFT',
        quantity: 5,
        price: 350.0,
        type: 'buy',
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    await adminClient.from('transactions').insert(transactions);
    
    const response = NextResponse.json({
      success: true,
      message: 'Auth session fixed and test data created',
      details: {
        user: user,
        sessionExpiry: new Date(expiresAt * 1000).toISOString(),
        portfolio: portfolioData
      },
      nextSteps: [
        "Go back to your application and refresh the page",
        "You should now be logged in and see your portfolio data",
        "If still having issues, check your browser's Network tab for API responses"
      ]
    });
    
    return response;
  } catch (error) {
    console.error('Error in session-fix endpoint:', error);
    return NextResponse.json({
      error: 'Failed to fix session',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
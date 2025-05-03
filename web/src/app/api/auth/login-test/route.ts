import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

/**
 * This endpoint is for development purposes only!
 * It creates an admin-level session to help debug authentication issues.
 * REMOVE THIS IN PRODUCTION!
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        error: 'This endpoint is not available in production'
      }, { status: 403 });
    }
    
    // 1. Check if we have service role key (required for this operation)
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
    
    // 2. Create admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // 3. Check if we have a test user, create one if not
    let testUserId = '';
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    // Try to get existing user
    const { data: existingUser, error: lookupError } = await adminClient.auth.admin.listUsers();
    let user = existingUser?.users.find(u => u.email === testEmail);
    
    if (!user) {
      // Create test user if it doesn't exist
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      
      if (createError) {
        return NextResponse.json({
          error: 'Failed to create test user',
          details: createError.message
        }, { status: 500 });
      }
      
      user = newUser.user;
    }
    
    if (!user) {
      return NextResponse.json({
        error: 'Failed to get or create test user'
      }, { status: 500 });
    }
    
    testUserId = user.id;
    
    // 4. Verify/create a portfolio for this user
    let portfolioId = '';
    
    // Use normal client for the rest of operations
    const supabase = createServerSupabaseClient();
    
    // Check if portfolio exists
    const { data: portfolio, error: portfolioError } = await adminClient
      .from('portfolios')
      .select('id')
      .eq('user_id', testUserId)
      .maybeSingle();
      
    if (!portfolio) {
      // Create portfolio
      const { data: newPortfolio, error: createError } = await adminClient
        .from('portfolios')
        .insert({
          user_id: testUserId,
          name: 'Test Portfolio',
          balance: 10000,
          holdings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        return NextResponse.json({
          error: 'Failed to create portfolio',
          details: createError.message
        }, { status: 500 });
      }
      
      portfolioId = newPortfolio.id;
    } else {
      portfolioId = portfolio.id;
    }
    
    // 5. Generate sign-in link for the test account
    const { data, error: signInError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail
    });
    
    if (signInError || !data || !data.properties) {
      return NextResponse.json({
        error: 'Failed to generate sign-in link',
        details: signInError ? signInError.message : 'No link data returned'
      }, { status: 500 });
    }
    
    const actionLink = data.properties.action_link;
    
    // 6. Return success with helpful debugging info
    return NextResponse.json({
      success: true,
      message: 'Development test account ready',
      user: {
        id: testUserId,
        email: testEmail,
      },
      portfolio: {
        id: portfolioId
      },
      signIn: {
        url: actionLink,
        email: testEmail,
        password: testPassword,
        note: 'You can use either the magic link or email/password to sign in'
      },
      warning: 'THIS ENDPOINT SHOULD BE REMOVED IN PRODUCTION'
    });
    
  } catch (error) {
    console.error('Error in login-test endpoint:', error);
    return NextResponse.json({
      error: 'Failed to set up test account',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
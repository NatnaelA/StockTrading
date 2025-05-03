import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Debug information we'll collect
    const debugInfo: {
      cookies: any;
      headers: any;
      env: {
        supabaseUrl: boolean;
        supabaseAnonKey: boolean;
        supabaseServiceKey: boolean;
      };
      rawAuth: any;
      sessionResult: any;
      userResult: any;
      testQuery: any;
      dbResult: any;
    } = {
      cookies: {},
      headers: {},
      env: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      rawAuth: null,
      sessionResult: null,
      userResult: null,
      testQuery: null,
      dbResult: null
    };

    // Check request cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    debugInfo.cookies = {
      count: allCookies.length,
      names: allCookies.map(c => c.name),
      hasSbCookie: allCookies.some(c => c.name.includes('sb-')),
      values: allCookies.map(c => ({ name: c.name, truncatedValue: c.value?.substring(0, 20) + '...' }))
    };

    // Check request headers
    const headerEntries = Array.from(request.headers.entries());
    debugInfo.headers = {
      count: headerEntries.length,
      values: Object.fromEntries(headerEntries)
    };

    // Create Supabase client and attempt to fetch session
    const supabase = createServerSupabaseClient();
    
    try {
      // Raw auth check
      const { data: rawAuthData, error: rawAuthError } = await supabase.auth.getSession();
      debugInfo.rawAuth = {
        hasSession: !!rawAuthData?.session,
        sessionExpiry: rawAuthData?.session?.expires_at,
        userId: rawAuthData?.session?.user?.id,
        error: rawAuthError ? rawAuthError.message : null
      };
      
      // Try current user endpoint
      const { data: userData, error: userError } = await supabase.auth.getUser();
      debugInfo.userResult = {
        hasUser: !!userData?.user,
        userId: userData?.user?.id,
        email: userData?.user?.email,
        error: userError ? userError.message : null
      };
      
      // Try a simple query to validate the token works with the database
      if (userData?.user?.id) {
        const { data: queryData, error: queryError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userData.user.id)
          .maybeSingle();
          
        debugInfo.testQuery = {
          success: !queryError,
          data: queryData,
          error: queryError ? queryError.message : null
        };
      }
    } catch (authError) {
      debugInfo.sessionResult = {
        error: `Exception during auth check: ${authError instanceof Error ? authError.message : String(authError)}`
      };
    }
    
    // Attempt to run direct query to see if it's an auth or DB issue
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('count', { count: 'exact', head: true });
        
      debugInfo.dbResult = {
        success: !error,
        count: data,
        error: error ? error.message : null
      };
    } catch (dbError) {
      debugInfo.dbResult = {
        error: `Exception during DB query: ${dbError instanceof Error ? dbError.message : String(dbError)}`
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      debug: debugInfo
    });
  } catch (error) {
    console.error('Auth debugging error:', error);
    return NextResponse.json({
      error: 'Error during auth debugging',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const redirectPath = requestUrl.searchParams.get('redirect_to') || '/dashboard';
  
  console.log('[AUTH CALLBACK] Request received', { 
    url: request.url,
    hasCode: !!code,
    error,
    errorDescription,
    redirectPath
  });
  
  // Check all cookies for debugging
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  console.log('[AUTH CALLBACK] Available cookies:', allCookies.map(c => c.name));
  
  if (error) {
    console.error('[AUTH CALLBACK] Error in OAuth flow:', error, errorDescription);
    return NextResponse.redirect(new URL(`/login?error=${error}&error_description=${errorDescription || ''}`, request.url));
  }
  
  if (code) {
    // Create a Supabase client with the new method
    const supabase = await createClient();
    
    try {
      console.log('[AUTH CALLBACK] Exchanging code for session');
      // Exchange the code for a session
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error('[AUTH CALLBACK] Error exchanging code for session:', sessionError);
        return NextResponse.redirect(new URL('/login?error=session_exchange_error', request.url));
      }
      
      console.log('[AUTH CALLBACK] Session exchange successful', { 
        user: data.user?.id,
        hasSession: !!data.session,
        sessionExpiry: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'n/a'
      });
      
      // Check if the user has a profile
      if (data.user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('[AUTH CALLBACK] Error checking user profile:', profileError);
          }

          // If the user doesn't have a profile, create one
          if (!profileData) {
            console.log(`[AUTH CALLBACK] No profile found for ${data.user.id}. Attempting INSERT into public.users...`);
            const { data: insertData, error: insertError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email,
                created_at: new Date().toISOString(),
                profile_completed: false,
              })
              .select();

            if (insertError) {
              console.error(`[AUTH CALLBACK] FAILED TO INSERT into public.users for user ${data.user?.id}. RLS Policy check needed! Error:`, JSON.stringify(insertError, null, 2));
              console.error('[AUTH CALLBACK] Error Code:', insertError.code);
              console.error('[AUTH CALLBACK] Error Message:', insertError.message);
              console.error('[AUTH CALLBACK] Error Details:', insertError.details);
              console.error('[AUTH CALLBACK] Error Hint:', insertError.hint);
              
              return NextResponse.redirect(new URL('/login?error=profile_creation_error', request.url));
            }
            
            console.log(`[AUTH CALLBACK] Successfully INSERTED into public.users for ${data.user.id}. Inserted data:`, JSON.stringify(insertData, null, 2));

            // Wait a moment for the user insert to complete
            console.log('[AUTH CALLBACK] Waiting for user profile to be fully created...');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify user was actually created before creating portfolio
            const { data: verifyUser, error: verifyError } = await supabase
              .from('users')
              .select('id')
              .eq('id', data.user.id)
              .single();
              
            if (verifyError || !verifyUser) {
              console.error('[AUTH CALLBACK] User verification failed after creation:', verifyError);
              return NextResponse.redirect(new URL('/login?error=user_verification_error', request.url));
            }
            
            console.log('[AUTH CALLBACK] User profile verified. Proceeding to profile completion redirect.');

            // If this is a new user (profile was just created), redirect to profile completion
            return NextResponse.redirect(new URL('/complete-profile', request.url));
          }

          // Check if existing user has completed their profile
          if (profileData && !profileData.profile_completed) {
            console.log('[AUTH CALLBACK] Existing user has not completed profile, redirecting.');
            return NextResponse.redirect(new URL('/complete-profile', request.url));
          }
        } catch (err) {
          console.error('[AUTH CALLBACK] Error processing user profile:', err);
        }
      }
      
      // Ensure we're using the same domain for redirects as the original request
      // This is crucial for cookie handling
      const redirectUrl = new URL(redirectPath, request.url);
      
      // Redirect to the dashboard or profile completion page
      console.log(`[AUTH CALLBACK] Redirecting to ${redirectUrl.toString()}`);
      return NextResponse.redirect(redirectUrl);
    } catch (error) {
      console.error('[AUTH CALLBACK] Caught error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/login?error=auth_callback_error', request.url));
    }
  }

  // No code provided, redirect to login
  console.log('[AUTH CALLBACK] No auth code provided, redirecting to login');
  return NextResponse.redirect(new URL('/login', request.url));
} 
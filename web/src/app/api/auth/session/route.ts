import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * Create a session for a user.
 * This is called after successful client-side authentication to maintain the session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No access token provided' },
        { status: 400 }
      );
    }

    // Exchange the client token for a server session
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery', // Use recovery type as we're verifying a session token
    });

    if (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create session',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get the current session.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Get the session from the server client
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { success: false, message: 'No active session' },
        { status: 401 }
      );
    }

    // Get user profile data from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.session.user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected if profile not created yet
      console.error('Error fetching user profile:', userError);
    }

    return NextResponse.json({
      success: true,
      session: data.session,
      user: {
        ...data.session.user,
        profile: userData || null,
      },
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to verify session',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Delete the session cookie.
 * This is used for signing out.
 */
export async function DELETE() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Sign out and clear the session cookie
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully signed out',
    });
  } catch (error) {
    console.error('Error signing out:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sign out',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
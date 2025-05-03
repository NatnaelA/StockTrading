import { NextRequest, NextResponse } from 'next/server';
// Use the createClient function which utilizes @supabase/ssr
import { createClient } from '@/lib/supabase-server'; 
// Import SupabaseClient type for annotation
import { SupabaseClient } from '@supabase/supabase-js';
// import { createServerSupabaseClient } from '@/lib/supabase-server'; // Old import
// import { createClient } from '@supabase/supabase-js'; // Remove this if not needed elsewhere

// Ensure you have your Supabase URL and Anon Key in environment variables
// NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

// Define the expected shape of the request body
interface ProfileCompletionData {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  country?: string;
  phoneNumber?: string;
  postalCode?: string;
  // Add any other fields collected in the complete-profile form
}

async function createInitialPortfolio(supabase: SupabaseClient, userId: string): Promise<{ success: boolean; error?: any }> {
  console.log(`[API /profile/complete] Checking for existing portfolio for user: ${userId}`);
  const { data: existingPortfolio, error: fetchError } = await supabase
    .from('portfolios')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: row not found
    console.error('[API /profile/complete] Error checking existing portfolio:', fetchError);
    return { success: false, error: fetchError };
  }

  if (existingPortfolio) {
    console.log(`[API /profile/complete] Portfolio already exists for user ${userId}, ID: ${existingPortfolio.id}`);
    return { success: true }; // Already exists, count as success
  }

  console.log(`[API /profile/complete] Creating initial portfolio for user: ${userId}`);
  const { error: portfolioError } = await supabase
    .from('portfolios')
    .insert({
      // id: userId, // Let Supabase generate UUID or use if you have specific logic
      user_id: userId,
      name: 'My Portfolio', // Default name
      balance: 10000, // Default starting balance
      currency: 'USD',
      holdings: {},
      total_value: 10000,
      day_change: 0,
      day_change_percentage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (portfolioError) {
    console.error('[API /profile/complete] Error creating initial portfolio:', portfolioError);
    return { success: false, error: portfolioError };
  }

  console.log(`[API /profile/complete] Initial portfolio created successfully for user: ${userId}`);
  return { success: true };
}


export async function POST(request: NextRequest) {
  console.log('[API /profile/complete] Received request');
  // Use the async createClient function based on @supabase/ssr
  const supabase = await createClient(); 

  try {
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[API /profile/complete] Authentication error or no user');
      return NextResponse.json(
        { success: false, message: 'Unauthorized: No valid session' },
        { status: 401 }
      );
    }
    console.log(`[API /profile/complete] Authenticated user ID: ${user.id}`);

    // 2. Parse request body
    let requestData: ProfileCompletionData;
    try {
      requestData = await request.json();
      console.log('[API /profile/complete] Parsed request body:', requestData);
    } catch (parseError) {
      console.error('[API /profile/complete] Error parsing request body:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }

    // 3. Update user profile in Supabase 'users' table
    const profileUpdateData: Record<string, any> = {
      ...requestData, // Include all submitted fields
      profile_completed: true,
      updated_at: new Date().toISOString(),
    };

    // Map form field names if they differ from DB column names (e.g., firstName -> first_name)
    if (requestData.firstName) profileUpdateData.first_name = requestData.firstName;
    if (requestData.lastName) profileUpdateData.last_name = requestData.lastName;
    if (requestData.phoneNumber) profileUpdateData.phone_number = requestData.phoneNumber;
    if (requestData.postalCode) profileUpdateData.postal_code = requestData.postalCode;
    // Remove the original camelCase keys if mapping occurred to avoid unknown column errors
    delete profileUpdateData.firstName;
    delete profileUpdateData.lastName;
    delete profileUpdateData.phoneNumber;
    delete profileUpdateData.postalCode;


    console.log('[API /profile/complete] Updating user profile data:', profileUpdateData);
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(profileUpdateData)
      .eq('id', user.id)
      .select() // Optionally select the updated profile
      .single();

    if (updateError) {
      console.error('[API /profile/complete] Error updating user profile:', updateError);
      // Check for specific errors like 'violates row-level security policy'
      return NextResponse.json(
        { success: false, message: 'Failed to update profile', error: updateError.message },
        { status: 500 }
      );
    }

    console.log('[API /profile/complete] User profile updated successfully:', updatedProfile);

    // 4. Create the initial portfolio AFTER profile is marked complete
    const portfolioResult = await createInitialPortfolio(supabase, user.id);

    if (!portfolioResult.success) {
      // Log the error but don't necessarily fail the whole request,
      // profile update succeeded. Maybe return a specific status/message.
      console.warn('[API /profile/complete] Profile updated, but failed to create initial portfolio:', portfolioResult.error);
      // You might want to return a success=true but with a warning message
      return NextResponse.json({
        success: true, // Profile was updated
        message: 'Profile updated, but initial portfolio creation failed. Please try creating one manually or contact support.',
        profile: updatedProfile,
        portfolio_error: portfolioResult.error?.message || 'Unknown portfolio error'
      }, { status: 207 }); // 207 Multi-Status might be appropriate
    }

    // 5. Return success response
    return NextResponse.json({
      success: true,
      message: 'Profile completed and portfolio created successfully',
      profile: updatedProfile // Optionally return updated profile
    });

  } catch (error) {
    console.error('[API /profile/complete] Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
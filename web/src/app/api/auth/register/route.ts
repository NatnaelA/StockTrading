import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const supabase = createServiceSupabaseClient();
    const data = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      accountType,
      dateOfBirth,
      address,
      city,
      country,
      postalCode,
    } = data;

    // 1. Create user account in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
    });

    if (authError) {
      throw authError;
    }

    const user = authData.user;

    if (!user) {
      throw new Error('Failed to create user');
    }

    // 2. Create user profile in Supabase
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phoneNumber,
        account_type: accountType,
        date_of_birth: dateOfBirth,
        address: address,
        city: city,
        country: country,
        postal_code: postalCode,
        role: accountType === 'broker' ? 'broker-pending' : 'individual',
        kyc_status: 'pending',
        email_verified: true, // Since we auto-confirmed the email
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      // If profile creation fails, attempt to delete the user
      await supabase.auth.admin.deleteUser(user.id);
      throw profileError;
    }

    // Registration successful, user and profile created.
    // The user will be redirected to /complete-profile on next login/auth check.
    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please complete your profile.',
      userId: user.id,
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    let errorMessage = 'Failed to create account';
    let statusCode = 400;

    // Handle Supabase-specific errors
    if (error.code === 'USER_ALREADY_EXISTS' || error.message?.includes('already exists')) {
      errorMessage = 'Email is already registered';
    } else if (error.code === 'INVALID_PASSWORD') {
      errorMessage = 'Password must be at least 6 characters';
    } else if (error.status === 429) {
      errorMessage = 'Too many requests, please try again later';
      statusCode = 429;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 
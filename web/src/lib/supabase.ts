'use client';

// Import from ssr package
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js'; // Keep for service client

// Client-side Supabase client using ssr package
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables for client.');
}

// For client components, export a ready-to-use client
// This instance will handle cookie-based session management automatically.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side Supabase client creation function with service role
// Note: This should only be used in server components or API routes for admin operations
export const createServiceSupabaseClient = () => {
  const serviceSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!serviceSupabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables for service client');
    throw new Error('Missing required Supabase service environment variables');
  }
  
  return createClient(serviceSupabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}; 
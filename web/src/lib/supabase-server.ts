// Import the correct helper for App Router server components/Route Handlers
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
// import { Database } from '@/types/supabase'; // Add this back if you have Supabase types
import { createServerClient } from '@supabase/ssr';

// Server-side Supabase client (for server components and API routes)
export const createServerSupabaseClient = () => {
  const cookieStore = cookies(); // Get cookies from next/headers

  // Use the auth helper, passing it the cookie store
  // Explicitly pass URL and key to avoid issues with environment variables
  return createServerComponentClient(
    {
      cookies: () => cookieStore, // Pass the cookie store correctly
    },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    }
  );
};

export async function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.log('Cookie set error in server component (expected):', error);
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.log('Cookie remove error in server component (expected):', error);
          }
        },
      },
    }
  );
} 
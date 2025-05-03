"use client";

import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-client';

export function useAuthRedirect() {
  const router = useRouter();
  const supabase = createClient();

  const checkProfileAndRedirect = async (user: User | null) => {
    if (!user) return;

    try {
      // Fetch user profile from Supabase
      const { data: profile, error } = await supabase
        .from('users')
        .select('profile_completed')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (!profile || !profile.profile_completed) {
        router.replace('/complete-profile');
        return;
      }

      router.replace('/dashboard');
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  return { checkProfileAndRedirect };
} 
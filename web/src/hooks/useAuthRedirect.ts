"use client";

import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useAuthRedirect() {
  const router = useRouter();

  const checkProfileAndRedirect = async (user: User | null) => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists() || !userDoc.data()?.profileCompleted) {
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
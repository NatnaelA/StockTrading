import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export function useAuthRedirect() {
  const router = useRouter();

  const checkProfileAndRedirect = async (user: User | null) => {
    if (!user) {
      router.replace('/login');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const isProfileComplete = userDoc.exists() && userDoc.data()?.profileCompleted === true;

      if (!isProfileComplete) {
        router.replace('/complete-profile');
      } else {
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      router.replace('/login');
    }
  };

  return { checkProfileAndRedirect };
} 
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface UseProtectedRouteOptions {
  redirectTo?: string;
  isPublicRoute?: boolean;
}

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { redirectTo = '/login', isPublicRoute = false } = options;
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isAuthed = !!user;
      setIsAuthenticated(isAuthed);

      if (!isAuthed && !isPublicRoute) {
        // If not authenticated and route requires auth, redirect to login
        router.push(redirectTo);
      } else if (isAuthed && isPublicRoute) {
        // If authenticated and route is public-only (like login page), redirect to dashboard
        router.push('/dashboard');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, redirectTo, isPublicRoute]);

  return { loading, isAuthenticated };
} 
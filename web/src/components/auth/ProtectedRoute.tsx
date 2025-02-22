"use client";

import { ReactNode } from "react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

interface ProtectedRouteProps {
  children: ReactNode;
  isPublicRoute?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  isPublicRoute = false,
  redirectTo,
}: ProtectedRouteProps) {
  const { loading } = useProtectedRoute({
    isPublicRoute,
    redirectTo,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}

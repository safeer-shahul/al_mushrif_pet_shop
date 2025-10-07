// src/components/auth/ProtectedRoute.tsx

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireStaff?: boolean;
  requireSuperuser?: boolean;
  redirectTo?: string;
}

/**
 * A client-side component to wrap pages that require authentication or specific roles.
 * Handles redirection based on AuthContext state.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireStaff = false,
  requireSuperuser = false,
  redirectTo = '/login', 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Wait for loading to finish
    if (isLoading) {
      return;
    }

    // 2. Check Authentication
    if (requireAuth && !isAuthenticated) {
      console.log(`[AUTH] Unauthorized access to ${pathname}. Redirecting to ${redirectTo}`);
      router.replace(redirectTo);
      return;
    }

    // 3. Check Superuser Role (Highest priority)
    // Note: Staff access should ideally be handled within the Admin Layout, but this provides a strong page-level gate.
    if (requireSuperuser && (!user || !user.is_superuser)) {
      console.warn(`[AUTH] Access denied: Superuser required for ${pathname}.`);
      // Redirect staff/customers who try to access the superuser area
      router.replace('/mushrif-admin-login'); 
      return;
    }

    // 4. Check Staff Role
    if (requireStaff && (!user || (!user.is_superuser && !user.is_staff))) {
      console.warn(`[AUTH] Access denied: Staff required for ${pathname}.`);
      router.replace('/mushrif-admin-login'); 
      return;
    }

  }, [isLoading, isAuthenticated, user, requireAuth, requireStaff, requireSuperuser, redirectTo, router, pathname]);

  // If loading or authorization check is pending, show the spinner
  if (isLoading || 
      (requireAuth && !isAuthenticated) || 
      (requireSuperuser && !isAuthenticated) || // Block unauth even if they only hit the superuser check
      (requireStaff && !isAuthenticated)) {
    return <LoadingSpinner />;
  }

  // If authenticated and authorized, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
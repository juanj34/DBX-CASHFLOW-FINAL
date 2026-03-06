import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { BrandedLoader } from '@/components/ui/branded-loader';

// DEV_BYPASS: set to true to skip auth (when Supabase is unavailable)
const DEV_BYPASS_AUTH = false;

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null | undefined>(
    DEV_BYPASS_AUTH ? null : undefined
  );
  const location = useLocation();

  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (DEV_BYPASS_AUTH) {
    return <>{children}</>;
  }

  // Loading
  if (session === undefined) {
    return <BrandedLoader fullScreen />;
  }

  // Not authenticated
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

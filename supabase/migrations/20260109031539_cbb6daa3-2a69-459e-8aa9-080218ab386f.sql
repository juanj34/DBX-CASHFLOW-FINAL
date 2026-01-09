-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service can manage quote views" ON public.quote_views;

-- Note: Service role operations bypass RLS, so we don't need an explicit policy for edge functions
-- The SELECT policy for brokers is sufficient for frontend access
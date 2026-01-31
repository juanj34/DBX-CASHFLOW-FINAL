-- Create a public view for shared quotes that excludes sensitive client data
CREATE VIEW public.cashflow_quotes_public
WITH (security_invoker = on) AS
SELECT 
  id,
  broker_id,
  unit_size_sqf,
  unit_size_m2,
  inputs,
  created_at,
  updated_at,
  status_changed_at,
  presented_at,
  negotiation_started_at,
  sold_at,
  view_count,
  first_viewed_at,
  last_viewed_at,
  is_archived,
  archived_at,
  client_id,
  share_token,
  project_name,
  developer,
  unit,
  unit_type,
  title,
  status
  -- Excluded: client_name, client_email, client_country (sensitive PII)
FROM public.cashflow_quotes;

-- Drop the existing public access policy
DROP POLICY IF EXISTS "Public can view shared quotes" ON public.cashflow_quotes;

-- Create a new restricted policy for public access via view only
-- Direct table access for shared quotes is now denied; use the view instead
CREATE POLICY "Public can view shared quotes via view" 
ON public.cashflow_quotes 
FOR SELECT 
USING (
  -- Allow if user is the broker owner
  auth.uid() = broker_id
  OR
  -- Allow if client accessing via portal
  client_id IN (
    SELECT id FROM clients 
    WHERE portal_token IS NOT NULL AND portal_enabled = true
  )
  -- Note: Direct public access via share_token is now blocked
  -- Public viewers must use the cashflow_quotes_public view
);

-- Grant SELECT on the public view to anon and authenticated roles
GRANT SELECT ON public.cashflow_quotes_public TO anon;
GRANT SELECT ON public.cashflow_quotes_public TO authenticated;
-- Create quote_versions table for storing immutable snapshots
CREATE TABLE public.quote_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES public.cashflow_quotes(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  
  -- Snapshot of all quote data at time of save
  inputs jsonb NOT NULL,
  title text,
  client_name text,
  client_email text,
  client_country text,
  project_name text,
  developer text,
  unit text,
  unit_type text,
  unit_size_sqf numeric,
  unit_size_m2 numeric,
  
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX idx_quote_versions_quote_id ON public.quote_versions(quote_id);
CREATE INDEX idx_quote_versions_created_at ON public.quote_versions(quote_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.quote_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view versions of their own quotes
CREATE POLICY "Users can view own quote versions"
ON public.quote_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cashflow_quotes
    WHERE cashflow_quotes.id = quote_versions.quote_id
    AND cashflow_quotes.broker_id = auth.uid()
  )
);

-- RLS Policy: Users can insert versions for their own quotes
CREATE POLICY "Users can create versions for own quotes"
ON public.quote_versions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cashflow_quotes
    WHERE cashflow_quotes.id = quote_versions.quote_id
    AND cashflow_quotes.broker_id = auth.uid()
  )
);
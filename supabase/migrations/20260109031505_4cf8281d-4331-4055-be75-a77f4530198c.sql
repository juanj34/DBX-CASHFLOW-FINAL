-- Create quote_views table for detailed view tracking
CREATE TABLE public.quote_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.cashflow_quotes(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  city TEXT,
  region TEXT,
  country TEXT,
  country_code TEXT,
  timezone TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add last_viewed_at to cashflow_quotes for quick access
ALTER TABLE public.cashflow_quotes ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.quote_views ENABLE ROW LEVEL SECURITY;

-- Brokers can view their quote's views
CREATE POLICY "Brokers can view their quote views"
ON public.quote_views FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.cashflow_quotes
  WHERE cashflow_quotes.id = quote_views.quote_id
  AND cashflow_quotes.broker_id = auth.uid()
));

-- Service role can insert/update views (for edge functions)
CREATE POLICY "Service can manage quote views"
ON public.quote_views FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_quote_views_quote_id ON public.quote_views(quote_id);
CREATE INDEX idx_quote_views_session_id ON public.quote_views(session_id);
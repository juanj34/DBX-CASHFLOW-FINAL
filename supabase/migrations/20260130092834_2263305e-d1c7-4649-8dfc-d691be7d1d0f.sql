-- Create table for secondary comparisons persistence
CREATE TABLE public.secondary_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL,
  title TEXT NOT NULL,
  quote_id UUID REFERENCES public.cashflow_quotes(id) ON DELETE SET NULL,
  secondary_inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  exit_months JSONB NOT NULL DEFAULT '[36, 60, 120]'::jsonb,
  rental_mode TEXT DEFAULT 'long-term',
  share_token TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.secondary_comparisons ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own comparisons
CREATE POLICY "Users can manage own secondary comparisons"
ON public.secondary_comparisons FOR ALL
USING (auth.uid() = broker_id)
WITH CHECK (auth.uid() = broker_id);

-- Policy: Public can view shared comparisons
CREATE POLICY "Public can view shared secondary comparisons"
ON public.secondary_comparisons FOR SELECT
USING (is_public = true AND share_token IS NOT NULL);

-- Add updated_at trigger
CREATE TRIGGER update_secondary_comparisons_updated_at
BEFORE UPDATE ON public.secondary_comparisons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create saved_comparisons table for persisting comparisons
CREATE TABLE public.saved_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quote_ids UUID[] NOT NULL,
  investment_focus TEXT,
  show_recommendations BOOLEAN DEFAULT true,
  share_token TEXT UNIQUE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for broker lookups
CREATE INDEX idx_saved_comparisons_broker_id ON public.saved_comparisons(broker_id);

-- Create index for share token lookups
CREATE INDEX idx_saved_comparisons_share_token ON public.saved_comparisons(share_token) WHERE share_token IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.saved_comparisons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own comparisons"
  ON public.saved_comparisons FOR SELECT
  USING (auth.uid() = broker_id);

CREATE POLICY "Users can create own comparisons"
  ON public.saved_comparisons FOR INSERT
  WITH CHECK (auth.uid() = broker_id);

CREATE POLICY "Users can update own comparisons"
  ON public.saved_comparisons FOR UPDATE
  USING (auth.uid() = broker_id);

CREATE POLICY "Users can delete own comparisons"
  ON public.saved_comparisons FOR DELETE
  USING (auth.uid() = broker_id);

-- Public access via share token
CREATE POLICY "Public can view shared comparisons"
  ON public.saved_comparisons FOR SELECT
  USING (is_public = true AND share_token IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_comparisons_updated_at
  BEFORE UPDATE ON public.saved_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
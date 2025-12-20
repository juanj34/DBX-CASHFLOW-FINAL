-- Create appreciation_presets table for users to save custom appreciation scenarios
CREATE TABLE public.appreciation_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  construction_appreciation NUMERIC NOT NULL DEFAULT 12,
  growth_appreciation NUMERIC NOT NULL DEFAULT 8,
  mature_appreciation NUMERIC NOT NULL DEFAULT 4,
  growth_period_years INTEGER NOT NULL DEFAULT 5,
  rent_growth_rate NUMERIC DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appreciation_presets ENABLE ROW LEVEL SECURITY;

-- Users can only access their own presets
CREATE POLICY "Users can manage own presets" 
ON public.appreciation_presets
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_appreciation_presets_updated_at
  BEFORE UPDATE ON public.appreciation_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Create table for custom value differentiators
CREATE TABLE public.custom_differentiators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  name_es TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  impacts_appreciation BOOLEAN NOT NULL DEFAULT false,
  appreciation_bonus NUMERIC NOT NULL DEFAULT 0,
  tooltip TEXT,
  tooltip_es TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_differentiators ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own custom differentiators
CREATE POLICY "Users can manage own custom differentiators"
ON public.custom_differentiators
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_differentiators_updated_at
BEFORE UPDATE ON public.custom_differentiators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
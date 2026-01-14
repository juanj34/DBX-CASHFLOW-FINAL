-- Add default appreciation rate columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_construction_appreciation numeric DEFAULT 12;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_growth_appreciation numeric DEFAULT 8;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_mature_appreciation numeric DEFAULT 4;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_growth_period_years integer DEFAULT 5;
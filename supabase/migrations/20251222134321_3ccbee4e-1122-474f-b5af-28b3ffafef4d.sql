-- Add appreciation columns to zones table for cashflow generator integration
ALTER TABLE public.zones 
ADD COLUMN IF NOT EXISTS construction_appreciation numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS growth_appreciation numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS mature_appreciation numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS growth_period_years integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rent_growth_rate numeric DEFAULT NULL;
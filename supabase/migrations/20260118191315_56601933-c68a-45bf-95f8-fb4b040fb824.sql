-- Add missing mortgage default columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_mortgage_valuation_fee numeric DEFAULT 3000;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_mortgage_registration_percent numeric DEFAULT 0.25;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_mortgage_life_insurance_percent numeric DEFAULT 0.4;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_mortgage_property_insurance numeric DEFAULT 1500;

-- Add is_builtin_override flag to appreciation_presets to track when user overrides a built-in preset
ALTER TABLE public.appreciation_presets ADD COLUMN IF NOT EXISTS is_builtin_override boolean DEFAULT false;
ALTER TABLE public.appreciation_presets ADD COLUMN IF NOT EXISTS builtin_key text DEFAULT null;
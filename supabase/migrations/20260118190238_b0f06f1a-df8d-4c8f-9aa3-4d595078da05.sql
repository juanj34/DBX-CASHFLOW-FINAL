-- Add Airbnb/Short-term rental default columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_adr numeric DEFAULT 800;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_occupancy_percent numeric DEFAULT 70;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_str_expense_percent numeric DEFAULT 25;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_str_management_percent numeric DEFAULT 15;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_adr_growth_rate numeric DEFAULT 3;

-- Add Mortgage default columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_mortgage_financing_percent numeric DEFAULT 60;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_mortgage_interest_rate numeric DEFAULT 4.5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_mortgage_term_years integer DEFAULT 25;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_mortgage_processing_fee numeric DEFAULT 1;
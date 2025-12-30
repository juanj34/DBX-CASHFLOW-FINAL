-- Add user-customizable settings to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 2,
  ADD COLUMN IF NOT EXISTS market_dubai_yield numeric DEFAULT 6.8,
  ADD COLUMN IF NOT EXISTS market_mortgage_rate numeric DEFAULT 4.5,
  ADD COLUMN IF NOT EXISTS market_top_area text DEFAULT 'Rashid Yachts & Marina';
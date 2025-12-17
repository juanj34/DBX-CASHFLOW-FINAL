-- Add investment profile columns to zones table
ALTER TABLE public.zones 
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS concept text,
ADD COLUMN IF NOT EXISTS maturity_level integer,
ADD COLUMN IF NOT EXISTS maturity_label text,
ADD COLUMN IF NOT EXISTS investment_focus text,
ADD COLUMN IF NOT EXISTS price_range_min numeric,
ADD COLUMN IF NOT EXISTS price_range_max numeric,
ADD COLUMN IF NOT EXISTS ticket_1br_min numeric,
ADD COLUMN IF NOT EXISTS ticket_1br_max numeric,
ADD COLUMN IF NOT EXISTS main_developer text;
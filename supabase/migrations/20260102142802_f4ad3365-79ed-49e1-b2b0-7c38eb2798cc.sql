-- Add view tracking columns to cashflow_quotes
ALTER TABLE public.cashflow_quotes 
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_viewed_at timestamp with time zone;
-- Add archive columns to cashflow_quotes
ALTER TABLE public.cashflow_quotes 
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;

ALTER TABLE public.cashflow_quotes 
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
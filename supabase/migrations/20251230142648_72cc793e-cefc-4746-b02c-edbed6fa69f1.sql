-- Add status column to cashflow_quotes table for deal pipeline tracking
ALTER TABLE public.cashflow_quotes 
ADD COLUMN status TEXT DEFAULT 'draft' 
CHECK (status IN ('draft', 'presented', 'negotiating', 'sold'));
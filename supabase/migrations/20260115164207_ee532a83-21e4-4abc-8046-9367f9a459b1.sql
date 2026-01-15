-- Drop the is_draft column since status field handles this
ALTER TABLE public.cashflow_quotes DROP COLUMN is_draft;
-- Add status tracking timestamp columns to cashflow_quotes
ALTER TABLE public.cashflow_quotes
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS presented_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS negotiation_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;
-- Add converted_to_property_id column to track which property was created from this quote
ALTER TABLE public.cashflow_quotes 
ADD COLUMN converted_to_property_id uuid REFERENCES public.acquired_properties(id) ON DELETE SET NULL;
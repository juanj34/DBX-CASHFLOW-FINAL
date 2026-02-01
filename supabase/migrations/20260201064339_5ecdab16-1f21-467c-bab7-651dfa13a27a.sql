-- Create acquired_properties table for portfolio tracking
CREATE TABLE public.acquired_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  source_quote_id uuid REFERENCES public.cashflow_quotes(id) ON DELETE SET NULL,
  
  -- Property Details
  project_name text NOT NULL,
  developer text,
  unit text,
  unit_type text,
  unit_size_sqf numeric,
  
  -- Acquisition Details
  purchase_price numeric NOT NULL,
  purchase_date date NOT NULL,
  acquisition_fees numeric DEFAULT 0,
  
  -- Current Tracking
  current_value numeric,
  last_valuation_date date,
  
  -- Rental Tracking
  is_rented boolean DEFAULT false,
  monthly_rent numeric,
  rental_start_date date,
  
  -- Mortgage Tracking
  has_mortgage boolean DEFAULT false,
  mortgage_amount numeric,
  mortgage_balance numeric,
  mortgage_interest_rate numeric,
  mortgage_term_years integer,
  monthly_mortgage_payment numeric,
  
  -- Notes
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.acquired_properties ENABLE ROW LEVEL SECURITY;

-- Broker can manage their own properties
CREATE POLICY "Brokers can manage their properties"
ON public.acquired_properties FOR ALL
USING (auth.uid() = broker_id)
WITH CHECK (auth.uid() = broker_id);

-- Clients can view their properties via portal token
CREATE POLICY "Clients can view properties via portal"
ON public.acquired_properties FOR SELECT
USING (client_id IN (
  SELECT id FROM public.clients 
  WHERE portal_token IS NOT NULL 
  AND portal_enabled = true
));

-- Create trigger for updated_at
CREATE TRIGGER update_acquired_properties_updated_at
BEFORE UPDATE ON public.acquired_properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
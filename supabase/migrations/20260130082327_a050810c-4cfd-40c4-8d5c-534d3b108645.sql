-- Create secondary_properties table for storing reusable secondary property configurations
CREATE TABLE IF NOT EXISTS public.secondary_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL,
  name text NOT NULL,
  purchase_price numeric NOT NULL DEFAULT 1200000,
  unit_size_sqf numeric NOT NULL DEFAULT 650,
  closing_costs_percent numeric NOT NULL DEFAULT 6,
  rental_yield_percent numeric NOT NULL DEFAULT 7,
  rent_growth_rate numeric NOT NULL DEFAULT 3,
  appreciation_rate numeric NOT NULL DEFAULT 3,
  service_charge_per_sqft numeric NOT NULL DEFAULT 22,
  use_mortgage boolean NOT NULL DEFAULT true,
  mortgage_financing_percent numeric NOT NULL DEFAULT 60,
  mortgage_interest_rate numeric NOT NULL DEFAULT 4.5,
  mortgage_term_years integer NOT NULL DEFAULT 25,
  show_airbnb boolean NOT NULL DEFAULT false,
  airbnb_adr numeric DEFAULT 600,
  airbnb_occupancy numeric DEFAULT 70,
  airbnb_operating_expense numeric DEFAULT 25,
  airbnb_management_fee numeric DEFAULT 15,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.secondary_properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for brokers to manage their own properties
CREATE POLICY "Users can manage own secondary properties"
  ON public.secondary_properties
  FOR ALL
  USING (auth.uid() = broker_id)
  WITH CHECK (auth.uid() = broker_id);

-- Create update trigger for updated_at
CREATE TRIGGER update_secondary_properties_updated_at
  BEFORE UPDATE ON public.secondary_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Create clients table for managing client information
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Client Information
  name text NOT NULL,
  email text,
  phone text,
  country text,
  
  -- Access Token for Client Portal
  portal_token text UNIQUE,
  portal_enabled boolean DEFAULT false,
  
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Brokers can manage their own clients"
  ON public.clients FOR ALL
  USING (auth.uid() = broker_id);

CREATE POLICY "Public access via portal token"
  ON public.clients FOR SELECT
  USING (portal_token IS NOT NULL AND portal_enabled = true);

-- Indexes for faster lookups
CREATE INDEX idx_clients_broker_id ON public.clients(broker_id);
CREATE INDEX idx_clients_portal_token ON public.clients(portal_token);

-- Add client_id to cashflow_quotes
ALTER TABLE public.cashflow_quotes 
  ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX idx_cashflow_quotes_client_id ON public.cashflow_quotes(client_id);

-- Add client_id to presentations
ALTER TABLE public.presentations 
  ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX idx_presentations_client_id ON public.presentations(client_id);

-- Update trigger for clients updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policy for quotes: allow public access when client has portal access
CREATE POLICY "Clients can view their quotes via portal"
  ON public.cashflow_quotes FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients 
      WHERE portal_token IS NOT NULL AND portal_enabled = true
    )
  );

-- RLS policy for presentations: allow public access when client has portal access  
CREATE POLICY "Clients can view their presentations via portal"
  ON public.presentations FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients 
      WHERE portal_token IS NOT NULL AND portal_enabled = true
    )
  );
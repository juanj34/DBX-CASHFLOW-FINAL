-- Add client_id to saved_comparisons table
ALTER TABLE public.saved_comparisons 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Add client_id to secondary_comparisons table
ALTER TABLE public.secondary_comparisons 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for efficient client lookups
CREATE INDEX idx_saved_comparisons_client_id ON public.saved_comparisons(client_id);
CREATE INDEX idx_secondary_comparisons_client_id ON public.secondary_comparisons(client_id);

-- RLS policy: Clients can view their own saved comparisons via portal
CREATE POLICY "Clients can view their comparisons via portal"
ON public.saved_comparisons
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients 
    WHERE portal_token IS NOT NULL AND portal_enabled = true
  )
);

-- RLS policy: Clients can view their own secondary comparisons via portal
CREATE POLICY "Clients can view their secondary comparisons via portal"
ON public.secondary_comparisons
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients 
    WHERE portal_token IS NOT NULL AND portal_enabled = true
  )
);
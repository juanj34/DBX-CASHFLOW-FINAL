-- Allow public to view broker profiles when viewing shared quotes
CREATE POLICY "Public can view broker profiles for shared quotes"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cashflow_quotes
    WHERE cashflow_quotes.broker_id = profiles.id
    AND cashflow_quotes.share_token IS NOT NULL
  )
);
-- Add avatar_url to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create cashflow_quotes table
CREATE TABLE public.cashflow_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  share_token text UNIQUE,
  
  -- Client Info
  client_name text,
  client_country text,
  client_email text,
  project_name text,
  developer text,
  unit text,
  unit_type text,
  unit_size_sqf numeric,
  unit_size_m2 numeric,
  
  -- Calculator Inputs (JSON for flexibility)
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  title text,
  is_draft boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cashflow_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cashflow_quotes
CREATE POLICY "Brokers can manage their own quotes"
ON public.cashflow_quotes FOR ALL
USING (auth.uid() = broker_id);

CREATE POLICY "Public can view shared quotes"
ON public.cashflow_quotes FOR SELECT
USING (share_token IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_cashflow_quotes_updated_at
BEFORE UPDATE ON public.cashflow_quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
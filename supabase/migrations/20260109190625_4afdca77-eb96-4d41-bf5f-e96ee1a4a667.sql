-- Create presentations table for managing presentation bundles
CREATE TABLE public.presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Content configuration (JSONB for flexibility)
  -- items structure: [{ type: 'quote' | 'comparison', id: 'uuid', viewMode?: 'story' | 'vertical' | 'compact' }]
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Sharing
  share_token TEXT UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  
  -- Analytics
  view_count INTEGER NOT NULL DEFAULT 0,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create presentation_views table for tracking analytics
CREATE TABLE public.presentation_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  -- Location data
  country TEXT,
  country_code TEXT,
  city TEXT,
  region TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for presentations
-- Brokers can view their own presentations
CREATE POLICY "Brokers can view their own presentations"
  ON public.presentations
  FOR SELECT
  USING (auth.uid() = broker_id);

-- Brokers can create their own presentations
CREATE POLICY "Brokers can create presentations"
  ON public.presentations
  FOR INSERT
  WITH CHECK (auth.uid() = broker_id);

-- Brokers can update their own presentations
CREATE POLICY "Brokers can update their own presentations"
  ON public.presentations
  FOR UPDATE
  USING (auth.uid() = broker_id);

-- Brokers can delete their own presentations
CREATE POLICY "Brokers can delete their own presentations"
  ON public.presentations
  FOR DELETE
  USING (auth.uid() = broker_id);

-- Public can view presentations with share_token
CREATE POLICY "Public can view shared presentations"
  ON public.presentations
  FOR SELECT
  USING (is_public = true AND share_token IS NOT NULL);

-- RLS Policies for presentation_views
-- Brokers can view analytics for their presentations
CREATE POLICY "Brokers can view their presentation analytics"
  ON public.presentation_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.presentations p
      WHERE p.id = presentation_id AND p.broker_id = auth.uid()
    )
  );

-- Anyone can insert view records (for tracking)
CREATE POLICY "Anyone can insert presentation views"
  ON public.presentation_views
  FOR INSERT
  WITH CHECK (true);

-- Anyone can update presentation views (for updating duration)
CREATE POLICY "Anyone can update presentation views"
  ON public.presentation_views
  FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_presentations_broker_id ON public.presentations(broker_id);
CREATE INDEX idx_presentations_share_token ON public.presentations(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_presentation_views_presentation_id ON public.presentation_views(presentation_id);
CREATE INDEX idx_presentation_views_session_id ON public.presentation_views(session_id);

-- Create updated_at trigger
CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for presentations
ALTER PUBLICATION supabase_realtime ADD TABLE public.presentations;
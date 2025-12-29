-- Enhance developers table with ratings and additional info
ALTER TABLE developers ADD COLUMN IF NOT EXISTS rating_quality numeric DEFAULT 0;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS rating_track_record numeric DEFAULT 0;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS rating_sales numeric DEFAULT 0;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS rating_design numeric DEFAULT 0;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS rating_flip_potential numeric DEFAULT 0;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS total_valuation numeric;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS short_bio text;

-- Enhance projects table with additional details
ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_units integer;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_towers integer;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_villas integer;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phases integer DEFAULT 1;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_masterplan boolean DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES zones(id);

-- Create cashflow_images table for quote-specific images
CREATE TABLE IF NOT EXISTS cashflow_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES cashflow_quotes(id) ON DELETE CASCADE,
  image_type text NOT NULL CHECK (image_type IN ('floor_plan', 'building_render')),
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on cashflow_images
ALTER TABLE cashflow_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage images for their own quotes
CREATE POLICY "Users can manage images for own quotes" ON cashflow_images
  FOR ALL USING (EXISTS (
    SELECT 1 FROM cashflow_quotes WHERE id = quote_id AND broker_id = auth.uid()
  ));

-- Policy: Public can view images for shared quotes
CREATE POLICY "Public can view images for shared quotes" ON cashflow_images
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM cashflow_quotes WHERE id = quote_id AND share_token IS NOT NULL
  ));

-- Create storage bucket for quote images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quote-images', 'quote-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for quote-images bucket
CREATE POLICY "Authenticated users can upload quote images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'quote-images');

CREATE POLICY "Authenticated users can update own quote images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'quote-images');

CREATE POLICY "Authenticated users can delete own quote images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'quote-images');

CREATE POLICY "Anyone can view quote images"
ON storage.objects FOR SELECT
USING (bucket_id = 'quote-images');
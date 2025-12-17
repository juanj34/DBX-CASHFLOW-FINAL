-- Create zone-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('zone-images', 'zone-images', true);

-- Public read access
CREATE POLICY "Public can view zone images"
ON storage.objects FOR SELECT
USING (bucket_id = 'zone-images');

-- Admins can manage
CREATE POLICY "Admins can manage zone images"
ON storage.objects FOR ALL
USING (bucket_id = 'zone-images' AND has_role(auth.uid(), 'admin'));
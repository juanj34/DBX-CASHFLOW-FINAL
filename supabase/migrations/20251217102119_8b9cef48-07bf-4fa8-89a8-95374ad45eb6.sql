-- Create landmarks table for photo points
CREATE TABLE public.landmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view landmarks"
ON public.landmarks
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage landmarks"
ON public.landmarks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_landmarks_updated_at
BEFORE UPDATE ON public.landmarks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for hotspot images
INSERT INTO storage.buckets (id, name, public) VALUES ('hotspot-images', 'hotspot-images', true);

-- Create storage bucket for landmark images
INSERT INTO storage.buckets (id, name, public) VALUES ('landmark-images', 'landmark-images', true);

-- Storage policies for hotspot-images
CREATE POLICY "Hotspot images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'hotspot-images');

CREATE POLICY "Admins can upload hotspot images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hotspot-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update hotspot images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hotspot-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete hotspot images"
ON storage.objects FOR DELETE
USING (bucket_id = 'hotspot-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for landmark-images
CREATE POLICY "Landmark images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'landmark-images');

CREATE POLICY "Admins can upload landmark images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'landmark-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update landmark images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'landmark-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete landmark images"
ON storage.objects FOR DELETE
USING (bucket_id = 'landmark-images' AND has_role(auth.uid(), 'admin'::app_role));
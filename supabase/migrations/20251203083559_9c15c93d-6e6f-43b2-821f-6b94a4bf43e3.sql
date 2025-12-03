-- Create developers table
CREATE TABLE public.developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  logo_url text,
  founded_year integer,
  description text,
  projects_launched integer DEFAULT 0,
  units_sold integer DEFAULT 0,
  occupancy_rate numeric,
  on_time_delivery_rate numeric,
  website text,
  headquarters text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

-- RLS policies for developers
CREATE POLICY "Everyone can view developers" ON public.developers FOR SELECT USING (true);
CREATE POLICY "Admins can manage developers" ON public.developers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_developers_updated_at
BEFORE UPDATE ON public.developers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add image_url and developer_id to projects
ALTER TABLE public.projects ADD COLUMN image_url text;
ALTER TABLE public.projects ADD COLUMN developer_id uuid REFERENCES public.developers(id);

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES ('project-images', 'project-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('developer-logos', 'developer-logos', true);

-- Storage policies for project-images
CREATE POLICY "Anyone can view project images" ON storage.objects FOR SELECT USING (bucket_id = 'project-images');
CREATE POLICY "Admins can upload project images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update project images" ON storage.objects FOR UPDATE USING (bucket_id = 'project-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete project images" ON storage.objects FOR DELETE USING (bucket_id = 'project-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for developer-logos
CREATE POLICY "Anyone can view developer logos" ON storage.objects FOR SELECT USING (bucket_id = 'developer-logos');
CREATE POLICY "Admins can upload developer logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'developer-logos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update developer logos" ON storage.objects FOR UPDATE USING (bucket_id = 'developer-logos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete developer logos" ON storage.objects FOR DELETE USING (bucket_id = 'developer-logos' AND has_role(auth.uid(), 'admin'::app_role));
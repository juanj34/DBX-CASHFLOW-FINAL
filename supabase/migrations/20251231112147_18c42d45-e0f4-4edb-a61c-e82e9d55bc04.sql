-- Add hero_image type support to cashflow_images
-- The existing image_type column already supports text values, so we just need to use 'hero_image' as a new type value
-- No schema changes needed for cashflow_images

-- Add hero_image_url to projects table for project-level hero images
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
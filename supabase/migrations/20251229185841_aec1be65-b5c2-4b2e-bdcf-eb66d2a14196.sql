-- Add new fields for Developer Trust Score system
ALTER TABLE public.developers
ADD COLUMN IF NOT EXISTS score_maintenance numeric DEFAULT 5,
ADD COLUMN IF NOT EXISTS flagship_project text;

-- Add comment for documentation
COMMENT ON COLUMN public.developers.score_maintenance IS 'Maintenance and property management score (0-10)';
COMMENT ON COLUMN public.developers.flagship_project IS 'Name of the developer flagship/signature project';
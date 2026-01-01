ALTER TABLE public.developers 
ADD COLUMN white_logo_url text;

COMMENT ON COLUMN public.developers.white_logo_url IS 'Inverted/white version of logo for dark backgrounds';
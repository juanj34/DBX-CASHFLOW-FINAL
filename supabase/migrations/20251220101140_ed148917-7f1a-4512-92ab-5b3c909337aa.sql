-- Add business contact fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_email TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_country_code TEXT DEFAULT '+971';
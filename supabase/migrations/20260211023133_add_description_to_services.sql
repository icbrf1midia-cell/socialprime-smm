-- Add description column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS description TEXT;

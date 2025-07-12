-- Add contact information fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN contact_phone TEXT,
ADD COLUMN contact_location TEXT;
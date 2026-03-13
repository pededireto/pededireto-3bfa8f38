-- Revoke public/anon access to sensitive owner contact fields on businesses table
-- This prevents unauthenticated users from scraping owner_email, owner_phone, owner_name
-- via direct Supabase API queries. The businesses_public view (which excludes these fields)
-- is the correct channel for public access.

REVOKE SELECT (owner_email, owner_phone, owner_name) ON public.businesses FROM anon;

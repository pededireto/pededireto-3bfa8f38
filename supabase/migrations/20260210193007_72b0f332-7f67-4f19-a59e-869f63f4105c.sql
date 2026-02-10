-- Remove the duplicate trigger that causes conflicts
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP FUNCTION IF EXISTS public.create_user_role();
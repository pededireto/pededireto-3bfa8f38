-- Fix: the trigger on profiles uses NEW.id (profile UUID) instead of NEW.user_id
-- Update the function to use NEW.user_id when inserting into user_roles
CREATE OR REPLACE FUNCTION public.assign_user_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only assign if user doesn't already have any role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'user');
  END IF;
  RETURN NEW;
END;
$$;
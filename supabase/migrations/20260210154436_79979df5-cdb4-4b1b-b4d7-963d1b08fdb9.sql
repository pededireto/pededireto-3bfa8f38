
-- Trigger to auto-assign 'user' role to new users (if they don't already have a role)
CREATE OR REPLACE FUNCTION public.assign_user_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only assign if user doesn't already have any role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger on profiles table (which is created after auth.users via handle_new_user)
CREATE OR REPLACE TRIGGER assign_user_role_after_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_user_role_on_signup();

-- Also need an INSERT policy on user_roles for this trigger (service role handles it via SECURITY DEFINER)

-- 1) Sincronizar email_confirmed_at de auth.users para profiles (backfill)
UPDATE public.profiles p
SET email_confirmed_at = u.email_confirmed_at
FROM auth.users u
WHERE u.id = p.user_id
  AND u.email_confirmed_at IS NOT NULL
  AND p.email_confirmed_at IS DISTINCT FROM u.email_confirmed_at;

-- 2) Backfill de telefone: copiar de auth.users.phone ou raw_user_meta_data->>'phone' quando profile.phone está vazio
UPDATE public.profiles p
SET phone = COALESCE(NULLIF(u.phone, ''), u.raw_user_meta_data->>'phone')
FROM auth.users u
WHERE u.id = p.user_id
  AND (p.phone IS NULL OR p.phone = '')
  AND COALESCE(NULLIF(u.phone, ''), u.raw_user_meta_data->>'phone') IS NOT NULL;

-- 3) Trigger para manter profiles.email_confirmed_at sincronizado quando auth.users muda
CREATE OR REPLACE FUNCTION public.sync_profile_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at THEN
    UPDATE public.profiles
       SET email_confirmed_at = NEW.email_confirmed_at
     WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_email_confirmed ON auth.users;
CREATE TRIGGER trg_sync_profile_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_email_confirmed();
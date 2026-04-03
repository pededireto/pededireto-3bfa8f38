
CREATE OR REPLACE FUNCTION public.trg_notify_business_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_profile_id uuid;
  v_owner_auth_uid uuid;
BEGIN
  IF OLD.is_active = false AND NEW.is_active = true THEN
    -- Auto-resolve any pending business alert
    UPDATE public.admin_alerts
      SET resolved_at = now()
      WHERE entity_type = 'business' AND entity_id = NEW.id AND resolved_at IS NULL;

    -- Find the owner's profile id from business_users
    SELECT bu.user_id INTO v_owner_profile_id
      FROM public.business_users bu
      WHERE bu.business_id = NEW.id AND bu.role = 'owner'
      LIMIT 1;

    IF v_owner_profile_id IS NOT NULL THEN
      -- Resolve the auth.users UUID from profiles
      SELECT p.user_id INTO v_owner_auth_uid
        FROM public.profiles p
        WHERE p.id = v_owner_profile_id;

      IF v_owner_auth_uid IS NOT NULL THEN
        INSERT INTO public.business_notifications (business_id, user_id, type, title, message, action_url)
        VALUES (
          NEW.id,
          v_owner_auth_uid,
          'verification',
          '🎉 O seu negócio foi verificado!',
          'O seu negócio ' || COALESCE(NEW.name, '') || ' está agora visível na Pede Direto! Complete o seu perfil para aparecer mais acima nos resultados.',
          '/negocio/dashboard'
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

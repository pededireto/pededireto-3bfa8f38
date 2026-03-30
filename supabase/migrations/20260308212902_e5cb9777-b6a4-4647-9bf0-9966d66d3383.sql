
CREATE OR REPLACE FUNCTION public.create_test_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i INT;
  test_email TEXT;
  test_uid UUID;
  existing_uid UUID;
BEGIN
  FOR i IN 1..10 LOOP
    test_email := 'test_user_' || i || '@pededireto.test';

    SELECT id INTO existing_uid FROM auth.users WHERE email = test_email;

    IF existing_uid IS NOT NULL THEN
      CONTINUE;
    END IF;

    test_uid := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      aud, role, confirmation_token
    ) VALUES (
      test_uid,
      '00000000-0000-0000-0000-000000000000',
      test_email,
      crypt('TestPassword123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Bot Teste ' || i, 'phone', '90000000' || i),
      'authenticated',
      'authenticated',
      ''
    );

    INSERT INTO public.profiles (id, user_id, email, full_name, phone, status, created_at, updated_at)
    VALUES (
      test_uid, test_uid, test_email,
      'Bot Teste ' || i,
      '90000000' || i,
      'active', now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (test_uid, 'consumer')
    ON CONFLICT (user_id, role) DO NOTHING;

  END LOOP;
END;
$$;

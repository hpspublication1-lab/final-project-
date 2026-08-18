-- Fix admin user: ensure admin@samyakcee.edu.np exists with correct password and role=admin

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin user already exists in auth.users
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@samyakcee.edu.np'
    LIMIT 1;

    IF admin_user_id IS NOT NULL THEN
        -- Admin auth user exists — update password and confirm email
        UPDATE auth.users
        SET
            encrypted_password = crypt('Admin@CEE2026!', gen_salt('bf', 10)),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now(),
            raw_user_meta_data = jsonb_build_object('full_name', 'Admin', 'role', 'admin')
        WHERE id = admin_user_id;

        RAISE NOTICE 'Updated existing admin auth user: %', admin_user_id;
    ELSE
        -- Admin does not exist — create fresh
        admin_user_id := gen_random_uuid();

        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
        ) VALUES (
            admin_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'admin@samyakcee.edu.np',
            crypt('Admin@CEE2026!', gen_salt('bf', 10)),
            now(),
            now(),
            now(),
            jsonb_build_object('full_name', 'Admin', 'role', 'admin'),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        );

        RAISE NOTICE 'Created new admin auth user: %', admin_user_id;
    END IF;

    -- Upsert user_profiles row with role=admin
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (admin_user_id, 'admin@samyakcee.edu.np', 'Admin', 'admin'::public.user_role)
    ON CONFLICT (id) DO UPDATE
        SET role = 'admin'::public.user_role,
            email = 'admin@samyakcee.edu.np',
            full_name = COALESCE(NULLIF(public.user_profiles.full_name, ''), 'Admin'),
            updated_at = now();

    RAISE NOTICE 'Admin user_profiles row ensured with role=admin for id: %', admin_user_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Admin fix migration error: %', SQLERRM;
END $$;

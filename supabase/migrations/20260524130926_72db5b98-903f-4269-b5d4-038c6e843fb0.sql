DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    old_user_id UUID;
    old_tenant_id UUID;
BEGIN
    -- Get IDs for the old developer
    SELECT u.id, p.tenant_id INTO old_user_id, old_tenant_id 
    FROM auth.users u 
    JOIN public.profiles p ON u.id = p.user_id 
    WHERE u.email = 'deyviduarte@gmail.com' LIMIT 1;

    -- 1. Create the new user in auth.users
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        'adm@radareleitoral.net',
        crypt('mudar123@', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Desenvolvedor do Sistema"}',
        now(),
        now(),
        'authenticated',
        'authenticated',
        '',
        '',
        '',
        ''
    );

    -- 2. Update existing data to point to the new user
    UPDATE public.contacts SET registered_by = new_user_id WHERE registered_by = old_user_id;
    UPDATE public.demands SET responsible_id = new_user_id WHERE responsible_id = old_user_id;
    UPDATE public.appointments SET created_by = new_user_id WHERE created_by = old_user_id;
    UPDATE public.audit_logs SET user_id = new_user_id WHERE user_id = old_user_id;
    UPDATE public.registration_links SET coordinator_id = new_user_id WHERE coordinator_id = old_user_id;
    UPDATE public.visit_requests SET requested_by = new_user_id WHERE requested_by = old_user_id;
    UPDATE public.visit_requests SET approved_by = new_user_id WHERE approved_by = old_user_id;

    -- 3. Update the new profile (created by trigger)
    UPDATE public.profiles 
    SET 
        tenant_id = old_tenant_id,
        status = 'approved',
        full_name = 'Desenvolvedor do Sistema'
    WHERE user_id = new_user_id;

    -- 4. Assign super_admin role to the new user
    INSERT INTO public.user_roles (user_id, role, tenant_id)
    VALUES (new_user_id, 'super_admin', old_tenant_id);

    -- 5. Delete the old developer user
    DELETE FROM auth.users WHERE id = old_user_id;
END $$;

DO $$
DECLARE
    new_dev_id UUID;
    temp_adm_id UUID;
    dev_tenant_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO new_dev_id FROM auth.users WHERE email = 'clickpublidigital@gmail.com';
    SELECT id INTO temp_adm_id FROM auth.users WHERE email = 'adm@radareleitoral.net';
    
    -- Get the tenant from the temporary admin
    SELECT tenant_id INTO dev_tenant_id FROM public.profiles WHERE user_id = temp_adm_id LIMIT 1;

    -- 1. Update data associations to the permanent developer account
    UPDATE public.contacts SET registered_by = new_dev_id WHERE registered_by = temp_adm_id;
    UPDATE public.demands SET responsible_id = new_dev_id WHERE responsible_id = temp_adm_id;
    UPDATE public.appointments SET created_by = new_dev_id WHERE created_by = temp_adm_id;
    UPDATE public.audit_logs SET user_id = new_dev_id WHERE user_id = temp_adm_id;
    UPDATE public.registration_links SET coordinator_id = new_dev_id WHERE coordinator_id = temp_adm_id;
    UPDATE public.visit_requests SET requested_by = new_dev_id WHERE requested_by = temp_adm_id;
    UPDATE public.visit_requests SET approved_by = new_dev_id WHERE approved_by = temp_adm_id;

    -- 2. Update permanent developer profile
    UPDATE public.profiles 
    SET 
        tenant_id = dev_tenant_id,
        status = 'approved',
        full_name = 'Desenvolvedor do Sistema'
    WHERE user_id = new_dev_id;

    -- 3. Assign super_admin role to permanent developer
    INSERT INTO public.user_roles (user_id, role, tenant_id)
    VALUES (new_dev_id, 'super_admin', dev_tenant_id)
    ON CONFLICT (user_id, role, tenant_id) DO NOTHING;

    -- 4. Set password
    UPDATE auth.users 
    SET encrypted_password = crypt('Radar123', gen_salt('bf'))
    WHERE id = new_dev_id;

    -- 5. Delete temporary admin
    DELETE FROM auth.users WHERE id = temp_adm_id;
END $$;

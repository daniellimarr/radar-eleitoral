-- 1. Identify the Developer (using current super admin email)
-- 2. Delete all user permissions except for the developer
DELETE FROM public.user_permissions 
WHERE user_id NOT IN (SELECT user_id FROM public.profiles WHERE email = 'deyviduarte@gmail.com');

-- 3. Delete all user roles except for the developer
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT user_id FROM public.profiles WHERE email = 'deyviduarte@gmail.com');

-- 4. Delete all profiles except for the developer
DELETE FROM public.profiles 
WHERE email != 'deyviduarte@gmail.com';

-- 5. Update Developer's name and ensure they have the super_admin role
UPDATE public.profiles 
SET full_name = 'Desenvolvedor do Sistema' 
WHERE email = 'deyviduarte@gmail.com';

-- Ensure the developer has the super_admin role
DO $$
DECLARE
    dev_user_id UUID;
    primary_tenant_id UUID;
BEGIN
    SELECT user_id INTO dev_user_id FROM public.profiles WHERE email = 'deyviduarte@gmail.com' LIMIT 1;
    SELECT tenant_id INTO primary_tenant_id FROM public.profiles WHERE email = 'deyviduarte@gmail.com' LIMIT 1;
    
    IF dev_user_id IS NOT NULL THEN
        -- Delete any other roles and insert super_admin if not exists
        IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = dev_user_id AND role = 'super_admin') THEN
            DELETE FROM public.user_roles WHERE user_id = dev_user_id;
            INSERT INTO public.user_roles (user_id, role, tenant_id) VALUES (dev_user_id, 'super_admin', primary_tenant_id);
        END IF;
    END IF;
END $$;

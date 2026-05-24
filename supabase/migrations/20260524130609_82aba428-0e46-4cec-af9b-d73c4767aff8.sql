-- 1. Detach data from users that will be deleted
UPDATE public.contacts SET registered_by = NULL WHERE registered_by != (SELECT id FROM auth.users WHERE email = 'deyviduarte@gmail.com');
UPDATE public.demands SET responsible_id = NULL WHERE responsible_id != (SELECT id FROM auth.users WHERE email = 'deyviduarte@gmail.com');
UPDATE public.appointments SET created_by = NULL WHERE created_by != (SELECT id FROM auth.users WHERE email = 'deyviduarte@gmail.com');
UPDATE public.audit_logs SET user_id = NULL WHERE user_id != (SELECT id FROM auth.users WHERE email = 'deyviduarte@gmail.com');
UPDATE public.registration_links SET coordinator_id = NULL WHERE coordinator_id != (SELECT id FROM auth.users WHERE email = 'deyviduarte@gmail.com');

-- 2. Delete records that MUST have a user (NOT NULL constraints)
DELETE FROM public.visit_requests WHERE requested_by != (SELECT id FROM auth.users WHERE email = 'deyviduarte@gmail.com');

-- 3. Now delete the users
DELETE FROM auth.users 
WHERE email != 'deyviduarte@gmail.com';

-- 4. Ensure the developer has the super_admin role
INSERT INTO public.user_roles (user_id, role, tenant_id)
SELECT id, 'super_admin'::public.app_role, (SELECT tenant_id FROM public.profiles WHERE email = 'deyviduarte@gmail.com' LIMIT 1)
FROM auth.users
WHERE email = 'deyviduarte@gmail.com'
ON CONFLICT (user_id, role, tenant_id) DO NOTHING;

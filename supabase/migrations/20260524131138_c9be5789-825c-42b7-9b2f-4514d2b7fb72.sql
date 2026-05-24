UPDATE auth.users 
SET encrypted_password = crypt('Radar123', gen_salt('bf'))
WHERE email = 'adm@radareleitoral.net';

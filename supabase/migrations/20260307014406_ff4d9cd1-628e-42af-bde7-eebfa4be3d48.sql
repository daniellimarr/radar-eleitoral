
-- Delete existing operator user and recreate properly
DELETE FROM public.user_permissions WHERE user_id = '1582017b-2d37-46c4-8af7-b418c60269c8';
DELETE FROM public.user_roles WHERE user_id = '1582017b-2d37-46c4-8af7-b418c60269c8';
DELETE FROM public.profiles WHERE user_id = '1582017b-2d37-46c4-8af7-b418c60269c8';
DELETE FROM auth.identities WHERE user_id = '1582017b-2d37-46c4-8af7-b418c60269c8';
DELETE FROM auth.users WHERE id = '1582017b-2d37-46c4-8af7-b418c60269c8';

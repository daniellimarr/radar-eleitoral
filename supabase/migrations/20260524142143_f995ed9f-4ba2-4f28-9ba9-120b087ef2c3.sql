-- Restrict execution of the recursion-breaking function
REVOKE ALL ON FUNCTION public.get_user_leader_contact_ids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_leader_contact_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_leader_contact_ids(uuid) TO service_role;

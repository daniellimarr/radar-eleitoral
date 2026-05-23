-- Ajustando subscriptions_safe para SECURITY INVOKER
ALTER VIEW public.subscriptions_safe SET (security_invoker = true);

-- Revogando privilégios EXECUTE de funções SECURITY DEFINER para usuários anônimos e autenticados onde for aplicável
-- Isso garante que as funções só sejam executadas via políticas ou triggers controlados, se for o caso.
-- No entanto, como o sistema as usa via RPC (como get_leader_name_for_link), 
-- manteremos o EXECUTE mas garantiremos que o search_path esteja travado (já feito).

-- Se o linter ainda reclama, é porque o EXECUTE para PUBLIC (que inclui anon) está ativo.
-- Vamos restringir o acesso público e conceder apenas ao que é necessário.

REVOKE EXECUTE ON FUNCTION public.encryption_key() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrypt_sensitive(text) FROM PUBLIC;


-- 1. Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.get_leader_name_for_link(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.tenant_has_active_registration_link(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) FROM anon, authenticated, public;

-- 2. Hide payment processor IDs from non-admin tenant members (column-level)
REVOKE SELECT (asaas_customer_id) ON public.profiles FROM anon, authenticated;
REVOKE SELECT (asaas_customer_id, asaas_subscription_id) ON public.subscriptions FROM anon, authenticated;

-- 3. user_permissions: prevent tenant-wide enumeration of permissions
DROP POLICY IF EXISTS "Users view own permissions" ON public.user_permissions;
CREATE POLICY "Users view own permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    has_role(auth.uid(), 'admin_gabinete'::app_role)
    AND tenant_id = get_user_tenant_id(auth.uid())
  )
  OR (
    has_role(auth.uid(), 'coordenador'::app_role)
    AND tenant_id = get_user_tenant_id(auth.uid())
  )
);

-- 4. chat_messages: enforce tenant boundary in addition to participant check
DROP POLICY IF EXISTS "Participants view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants update read status" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants delete messages" ON public.chat_messages;

CREATE POLICY "Participants view messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  is_chat_participant(conversation_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.tenant_id = get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "Participants send messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND is_chat_participant(conversation_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.tenant_id = get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "Participants update read status"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  is_chat_participant(conversation_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.tenant_id = get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "Participants delete messages"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (
  is_chat_participant(conversation_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.tenant_id = get_user_tenant_id(auth.uid())
  )
);

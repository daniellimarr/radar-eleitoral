
DROP POLICY "Authenticated insert participants" ON public.chat_participants;

CREATE POLICY "Tenant users insert participants" ON public.chat_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations cc
      WHERE cc.id = chat_participants.conversation_id
      AND cc.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

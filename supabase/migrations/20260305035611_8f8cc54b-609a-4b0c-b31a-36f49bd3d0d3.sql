
-- Allow participants to delete messages in their conversations
CREATE POLICY "Participants delete messages"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (is_chat_participant(conversation_id, auth.uid()));

-- Allow conversation creator or participants to delete participants
CREATE POLICY "Participants delete own participations"
ON public.chat_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Allow conversation creator to delete conversations
CREATE POLICY "Creator delete conversations"
ON public.chat_conversations
FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR tenant_id = get_user_tenant_id(auth.uid()));

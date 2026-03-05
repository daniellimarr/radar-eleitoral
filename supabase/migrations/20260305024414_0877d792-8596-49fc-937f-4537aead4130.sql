
-- Fix infinite recursion in chat_participants SELECT policy
-- Drop the problematic policy that references itself
DROP POLICY IF EXISTS "Users view own participations" ON public.chat_participants;

-- Create a security definer function to check if user is participant in a conversation
CREATE OR REPLACE FUNCTION public.is_chat_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
  )
$$;

-- Recreate the policy using the security definer function (no self-reference)
CREATE POLICY "Users view own participations"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_chat_participant(conversation_id, auth.uid())
);

-- Also fix chat_messages policies that reference chat_participants to use the function
DROP POLICY IF EXISTS "Participants view messages" ON public.chat_messages;
CREATE POLICY "Participants view messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (public.is_chat_participant(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Participants send messages" ON public.chat_messages;
CREATE POLICY "Participants send messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_chat_participant(conversation_id, auth.uid())
);

DROP POLICY IF EXISTS "Participants update read status" ON public.chat_messages;
CREATE POLICY "Participants update read status"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (public.is_chat_participant(conversation_id, auth.uid()));

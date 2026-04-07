
-- Fix 1: Restrict admin_gabinete from assigning admin_gabinete role
DROP POLICY IF EXISTS "Admin manages roles" ON public.user_roles;

CREATE POLICY "Admin manages roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin_gabinete')
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin_gabinete')
  AND role IN ('operador', 'assessor', 'coordenador')
  AND user_id != auth.uid()
);

-- Fix 2: Chat participants - add tenant scoping to prevent cross-tenant access
DROP POLICY IF EXISTS "Users view own participations" ON public.chat_participants;

CREATE POLICY "Users view own participations"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid())
  OR (
    is_chat_participant(conversation_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM chat_conversations cc
      WHERE cc.id = chat_participants.conversation_id
      AND cc.tenant_id = get_user_tenant_id(auth.uid())
    )
  )
);

-- Fix 3: Tighten chat participant INSERT to also check user belongs to same tenant
DROP POLICY IF EXISTS "Tenant users insert participants" ON public.chat_participants;

CREATE POLICY "Tenant users insert participants"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_conversations cc
    WHERE cc.id = chat_participants.conversation_id
    AND cc.tenant_id = get_user_tenant_id(auth.uid())
  )
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = chat_participants.user_id
    AND p.tenant_id = get_user_tenant_id(auth.uid())
  )
);

-- Fix 4: Chat participant DELETE should also be tenant-scoped
DROP POLICY IF EXISTS "Participants delete own participations" ON public.chat_participants;

CREATE POLICY "Participants delete own participations"
ON public.chat_participants
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM chat_conversations cc
    WHERE cc.id = chat_participants.conversation_id
    AND cc.tenant_id = get_user_tenant_id(auth.uid())
  )
);

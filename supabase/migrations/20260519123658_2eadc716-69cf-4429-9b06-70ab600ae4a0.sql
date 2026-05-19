-- Ajuste de segurança para funções SECURITY DEFINER
-- O linter do Supabase recomenda definir o search_path explicitamente

-- Exemplo para a função de links de cadastro
ALTER FUNCTION public.get_registration_link_info(text) SET search_path = public;

-- Se houver outras funções SECURITY DEFINER, elas devem ser ajustadas aqui.
-- Vamos listar e ajustar as mais comuns baseadas no padrão do projeto.

DO $$
DECLARE
    func_name TEXT;
BEGIN
    FOR func_name IN 
        SELECT proname 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        EXECUTE format('ALTER FUNCTION public.%I SET search_path = public', func_name);
    END LOOP;
END $$;

-- Garantir que tabelas críticas tenham RLS e políticas (mesmo que restritivas)
-- O linter avisou sobre tabelas sem políticas.

-- Exemplo: audit_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Admins can view audit logs'
    ) THEN
        CREATE POLICY "Admins can view audit logs" ON public.audit_logs
        FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role IN ('super_admin', 'admin_gabinete')
            )
        );
    END IF;
END $$;

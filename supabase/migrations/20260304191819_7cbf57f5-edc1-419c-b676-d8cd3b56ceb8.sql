
-- Add status column to profiles for approval workflow
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Set existing profiles to approved so they keep working
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';

-- Change default back to pending for new signups
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'pending';

-- Create trigger function to notify admins on new user registration
CREATE OR REPLACE FUNCTION public.notify_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert notification for admins/coordinators of the same tenant
  -- For new registrations without tenant, we skip (they need to be assigned)
  -- The notification will be created when an admin sees the pending user
  INSERT INTO public.notifications (tenant_id, title, message, type, created_by)
  SELECT DISTINCT t.id, 
    'Novo cadastro pendente',
    COALESCE(NEW.full_name, 'Novo usuário') || ' solicitou acesso ao sistema',
    'pending_approval',
    NEW.user_id
  FROM public.tenants t
  WHERE t.id IS NOT NULL
  LIMIT 1;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles insert
DROP TRIGGER IF EXISTS trg_notify_new_user_registration ON public.profiles;
CREATE TRIGGER trg_notify_new_user_registration
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_new_user_registration();

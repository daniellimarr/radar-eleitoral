
-- Recreate the trigger for new user registration notifications
CREATE TRIGGER on_new_user_registration
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_new_user_registration();

-- Also recreate the trigger for new contacts by operators
CREATE TRIGGER on_new_contact_by_operator
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_contact_by_operator();

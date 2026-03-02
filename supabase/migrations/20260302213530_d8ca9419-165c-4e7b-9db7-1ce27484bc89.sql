
ALTER TABLE public.registration_links
ADD COLUMN leader_contact_id uuid REFERENCES public.contacts(id) DEFAULT NULL;

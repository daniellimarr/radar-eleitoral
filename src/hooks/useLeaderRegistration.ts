import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { geocodeByCep } from "@/lib/geocoding";
import { toast } from "sonner";

interface Voter {
  id: string;
  name: string;
  phone: string | null;
  neighborhood: string | null;
  voting_zone: string | null;
}

export function useLeaderRegistration(id: string | undefined) {
  const { tenantId, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [leaderContactId, setLeaderContactId] = useState<string | null>(null);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loadingVoters, setLoadingVoters] = useState(false);

  const [form, setForm] = useState({
    name: "",
    nickname: "",
    phone: "",
    gender: "",
    birth_date: "",
    has_whatsapp: false,
    cep: "",
    address: "",
    address_number: "",
    neighborhood: "",
    city: "",
    state: "RR",
    voting_zone: "",
    voting_section: "",
    voting_location: "",
    engagement: "nao_trabalhado" as string,
  });

  const [geoCoords, setGeoCoords] = useState({ latitude: null as number | null, longitude: null as number | null });

  const loadLeader = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: leader } = await supabase
        .from("leaders")
        .select("id, contact_id")
        .or(`id.eq.${id},contact_id.eq.${id}`)
        .limit(1)
        .single();
      
      const contactId = leader?.contact_id || id;
      setLeaderContactId(contactId);

      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .single();
        
      if (data) {
        setForm({
          name: data.name || "",
          nickname: data.nickname || "",
          phone: data.phone || "",
          gender: data.gender || "",
          birth_date: data.birth_date || "",
          has_whatsapp: data.has_whatsapp || false,
          cep: data.cep || "",
          address: data.address || "",
          address_number: data.address_number || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          state: data.state || "RR",
          voting_zone: data.voting_zone || "",
          voting_section: data.voting_section || "",
          voting_location: data.voting_location || "",
          engagement: data.engagement || "nao_trabalhado",
        });
        setGeoCoords({ latitude: data.latitude || null, longitude: data.longitude || null });
      }
    } catch (err) {
      console.error("Error loading leader:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadVoters = useCallback(async () => {
    if (!leaderContactId) return;
    setLoadingVoters(true);
    try {
      const { data } = await supabase
        .from("contacts")
        .select("id, name, phone, neighborhood, voting_zone")
        .eq("leader_id", leaderContactId)
        .is("deleted_at", null)
        .order("name");
      setVoters(data || []);
    } catch (err) {
      console.error("Error loading voters:", err);
    } finally {
      setLoadingVoters(false);
    }
  }, [leaderContactId]);

  useEffect(() => {
    loadLeader();
  }, [loadLeader]);

  useEffect(() => {
    loadVoters();
  }, [loadVoters]);

  const handleCepBlur = async () => {
    const cleanCep = form.cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    
    setGeocoding(true);
    const result = await geocodeByCep(form.cep);
    if (result) {
      setForm(prev => ({
        ...prev,
        address: result.address || prev.address,
        neighborhood: result.neighborhood || prev.neighborhood,
        city: result.city || prev.city,
        state: result.state || prev.state,
      }));
      setGeoCoords({ latitude: result.latitude || null, longitude: result.longitude || null });
    }
    setGeocoding(false);
  };

  const handleSave = async () => {
    if (!tenantId) {
      toast.error("Erro: usuário sem vínculo a um gabinete.");
      return false;
    }
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return false;
    }
    
    setSaving(true);
    try {
      const contactData: any = {
        ...form,
        latitude: geoCoords.latitude,
        longitude: geoCoords.longitude,
      };

      if (id) {
        const contactId = leaderContactId || id;
        const { error } = await supabase.from("contacts").update(contactData).eq("id", contactId);
        if (error) throw error;
        toast.success("Liderança atualizada com sucesso!");
      } else {
        const { data: contact, error: contactError } = await supabase
          .from("contacts")
          .insert({ ...contactData, tenant_id: tenantId, is_leader: true })
          .select("id")
          .single();
        if (contactError) throw contactError;

        await supabase.from("leaders").insert({
          contact_id: contact.id,
          tenant_id: tenantId,
        });

        // Registration link auto-gen
        const slug = (form.nickname || form.name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
        await supabase.from("registration_links").insert({
          tenant_id: tenantId,
          slug,
          leader_contact_id: contact.id,
          coordinator_id: user?.id,
        });

        toast.success("Liderança cadastrada com sucesso!");
      }
      return true;
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    setForm,
    voters,
    loading,
    saving,
    geocoding,
    loadingVoters,
    actions: {
      handleCepBlur,
      handleSave,
      refreshVoters: loadVoters
    }
  };
}

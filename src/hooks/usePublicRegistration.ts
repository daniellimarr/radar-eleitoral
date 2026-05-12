import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { geocodeByCep } from "@/lib/geocoding";
import { toast } from "sonner";
import { validateCpf } from "@/lib/utils/formatters";

export function usePublicRegistration(slug: string | undefined) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [leaderContactId, setLeaderContactId] = useState<string | null>(null);
  const [leaderName, setLeaderName] = useState("");
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  
  const [form, setForm] = useState({
    name: "", nickname: "", cpf: "", gender: "", birth_date: "",
    phone: "", has_whatsapp: false,
    cep: "", address: "", address_number: "", neighborhood: "",
    city: "Boa Vista", state: "RR",
    voting_zone: "", voting_section: "", voting_location: "",
    engagement: "nao_trabalhado",
  });

  const [geoCoords, setGeoCoords] = useState({ latitude: null as number | null, longitude: null as number | null });
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);

  useEffect(() => {
    const loadTenant = async () => {
      if (!slug) return;
      try {
        // Use SECURITY DEFINER RPC to avoid exposing the full registration_links table to anon
        const { data: linkInfo } = await supabase.rpc("get_registration_link_info", { p_slug: slug });
        const info = Array.isArray(linkInfo) ? linkInfo[0] : linkInfo;
        if (info?.tenant_id) {
          setTenantId(info.tenant_id);
          setLeaderContactId(info.leader_contact_id ?? null);
          setTenantName(info.tenant_name ?? "");
          setLeaderName(info.leader_name ?? "");
        }
      } catch (err) {
        console.error("Error loading tenant:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTenant();
  }, [slug]);

  const updateForm = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === "cpf") setCpfValid(null);
  };

  const handleCpfBlur = () => {
    if (form.cpf.replace(/\D/g, "").length === 11) {
      setCpfValid(validateCpf(form.cpf));
    } else {
      setCpfValid(null);
    }
  };

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

  const handleSubmit = async () => {
    if (!tenantId || !form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    
    const cleanedCpf = form.cpf.replace(/\D/g, "");
    if (!cleanedCpf || cleanedCpf.length !== 11) {
      toast.error("CPF é obrigatório");
      return;
    }
    
    if (cpfValid === false) {
      toast.error("CPF inválido");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("contacts").insert({
        name: form.name,
        nickname: form.nickname || null,
        cpf: form.cpf || null,
        gender: form.gender || null,
        birth_date: form.birth_date || null,
        phone: form.phone || null,
        has_whatsapp: form.has_whatsapp,
        cep: form.cep || null,
        address: form.address || null,
        address_number: form.address_number || null,
        neighborhood: form.neighborhood || null,
        city: form.city || null,
        state: form.state || null,
        voting_zone: form.voting_zone || null,
        voting_section: form.voting_section || null,
        voting_location: form.voting_location || null,
        engagement: form.engagement as any,
        tenant_id: tenantId,
        leader_id: leaderContactId,
        is_leader: false,
        latitude: geoCoords.latitude,
        longitude: geoCoords.longitude,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao realizar cadastro");
    } finally {
      setSaving(false);
    }
  };

  return {
    tenantId,
    tenantName,
    leaderName,
    form,
    loading,
    saving,
    geocoding,
    submitted,
    cpfValid,
    actions: {
      updateForm,
      handleCepBlur,
      handleCpfBlur,
      handleSubmit,
    }
  };
}

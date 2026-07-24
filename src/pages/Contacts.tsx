import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useContacts } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { geocodeByCep } from "@/lib/geocoding";
import { ContactForm } from "@/components/features/contacts/ContactForm";
import { ContactTable } from "@/components/features/contacts/ContactTable";
import { ImportContactsDialog } from "@/components/features/contacts/ImportContactsDialog";
import { Contact, EngagementLevel } from "@/types";

interface ContactFormState {
  name: string;
  nickname: string;
  gender: string;
  birth_date: string | null;
  phone: string;
  has_whatsapp: boolean;
  cep: string;
  address: string;
  address_number: string;
  neighborhood: string;
  city: string;
  state: string;
  voting_zone: string;
  voting_section: string;
  voting_location: string;
  engagement: EngagementLevel;
  is_leader: boolean;
  leader_id: string | null;
}

const defaultContact: ContactFormState = {
  name: "", nickname: "", gender: "", birth_date: null,
  phone: "", has_whatsapp: false, cep: "", address: "",
  address_number: "", neighborhood: "", city: "Boa Vista", state: "RR",
  voting_zone: "", voting_section: "", voting_location: "",
  engagement: "nao_trabalhado" as EngagementLevel, is_leader: false,
  leader_id: null,
};

export default function Contacts() {
  const { hasRole, profile } = useAuth();
  const { 
    contacts, 
    leaders, 
    loading, 
    search, 
    setSearch, 
    saveContact, 
    deleteContact 
  } = useContacts();

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultContact);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  
  const tableRef = useRef<HTMLTableElement>(null);

  const handleCepBlur = async () => {
    if (!form.cep || form.cep.replace(/\D/g, "").length !== 8) return;
    setGeocoding(true);
    const result = await geocodeByCep(form.cep);
    if (result) {
      setForm((prev) => ({
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

  const isOperador = hasRole("operador");

  const handleSubmit = async () => {
    let finalLat = geoCoords.latitude;
    let finalLon = geoCoords.longitude;

    if (!finalLat || !finalLon) {
      setGeocoding(true);
      const result = await geocodeByCep(form.cep);
      if (result?.latitude) {
        finalLat = result.latitude;
        finalLon = result.longitude;
      }
      setGeocoding(false);
    }

    const success = await saveContact({ ...form, birth_date: form.birth_date || null, latitude: finalLat, longitude: finalLon }, editingId);
    if (success) {
      setIsOpen(false);
      setForm(defaultContact);
      setEditingId(null);
    }
  };

  const handleEdit = (contact: Contact) => {
    setForm({
      name: contact.name || "", nickname: contact.nickname || "",
      gender: contact.gender || "", birth_date: contact.birth_date || null,
      phone: contact.phone || "", has_whatsapp: contact.has_whatsapp || false,
      cep: contact.cep || "", address: contact.address || "",
      address_number: contact.address_number || "", neighborhood: contact.neighborhood || "",
      city: contact.city || "Boa Vista", state: contact.state || "RR",
      voting_zone: contact.voting_zone || "", voting_section: contact.voting_section || "",
      voting_location: contact.voting_location || "",
      engagement: contact.engagement || "nao_trabalhado",
      is_leader: contact.is_leader || false,
      leader_id: contact.leader_id || "",
    });
    setEditingId(contact.id);
    setIsOpen(true);
  };

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cadastro &gt; Contato</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setForm(defaultContact); setEditingId(null); setIsOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> NOVO CADASTRO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Contato" : "Novo Cadastro"}</DialogTitle>
            </DialogHeader>
            
            <ContactForm 
              form={form}
              updateField={updateField}
              handleCepBlur={handleCepBlur}
              geocoding={geocoding}
              isOperador={isOperador}
              profileName={profile?.full_name}
              leaders={leaders}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Filtros e Busca</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome..." 
                  className="pl-8" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <ImportContactsDialog />
              <ExportButtons tableRef={tableRef} title="Contatos" filename="contatos" />

            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ContactTable 
            tableRef={tableRef}
            contacts={contacts}
            onEdit={handleEdit}
            onDelete={deleteContact}
          />
        </CardContent>
      </Card>
    </div>
  );
}

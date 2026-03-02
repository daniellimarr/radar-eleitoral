import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, MapPin, Search } from "lucide-react";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const createPinIcon = (color: string, label?: string) =>
  new L.DivIcon({
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="background:${color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);">
        ${label || '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};margin-top:-2px;"></div>
    </div>`,
    className: "",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });

const leaderIcon = createPinIcon("#2563eb");
const voterIcon = createPinIcon("#ec4899");

const clusterIcon = (count: number, color: string) => {
  const size = Math.min(56, 32 + Math.floor(Math.log10(Math.max(count, 1)) * 12));
  return new L.DivIcon({
    html: `<div style="background:${color};color:white;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${count > 99 ? 11 : 13}px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);">
      ${count}
    </div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

interface ContactWithGeo {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_leader: boolean | null;
  leader_id: string | null;
  category: string | null;
  gender: string | null;
}

function FitBounds({ contacts }: { contacts: ContactWithGeo[] }) {
  const map = useMap();
  useEffect(() => {
    const withGeo = contacts.filter((c) => c.latitude && c.longitude);
    if (withGeo.length > 0) {
      const bounds = L.latLngBounds(withGeo.map((c) => [c.latitude!, c.longitude!]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [contacts, map]);
  return null;
}

export default function Georeferencing() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<ContactWithGeo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [filterCity, setFilterCity] = useState("all");
  const [filterNeighborhood, setFilterNeighborhood] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedLeader, setSelectedLeader] = useState<string>("all");

  useEffect(() => {
    if (!profile?.tenant_id) return;
    const fetchContacts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, nickname, phone, city, neighborhood, address, latitude, longitude, is_leader, leader_id, category, gender")
        .eq("tenant_id", profile.tenant_id!)
        .is("deleted_at", null);
      if (!error && data) setContacts(data as ContactWithGeo[]);
      setLoading(false);
    };
    fetchContacts();
  }, [profile?.tenant_id]);

  const cities = useMemo(() => [...new Set(contacts.map((c) => c.city).filter(Boolean))].sort(), [contacts]);
  const neighborhoods = useMemo(() => [...new Set(contacts.map((c) => c.neighborhood).filter(Boolean))].sort(), [contacts]);
  const categories = useMemo(() => [...new Set(contacts.map((c) => c.category).filter(Boolean))].sort(), [contacts]);
  const leadersList = useMemo(() => contacts.filter((c) => c.is_leader), [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (searchName && !c.name.toLowerCase().includes(searchName.toLowerCase())) return false;
      if (filterCity !== "all" && c.city !== filterCity) return false;
      if (filterNeighborhood !== "all" && c.neighborhood !== filterNeighborhood) return false;
      if (filterGender !== "all" && c.gender !== filterGender) return false;
      if (filterCategory !== "all" && c.category !== filterCategory) return false;
      if (selectedLeader !== "all" && c.leader_id !== selectedLeader && c.id !== selectedLeader) return false;
      return true;
    });
  }, [contacts, searchName, filterCity, filterNeighborhood, filterGender, filterCategory, selectedLeader]);

  // All contacts with geo, split by type
  const geoContacts = useMemo(() => filteredContacts.filter((c) => c.latitude && c.longitude), [filteredContacts]);
  const geoLeaders = useMemo(() => geoContacts.filter((c) => c.is_leader), [geoContacts]);
  const geoVoters = useMemo(() => geoContacts.filter((c) => !c.is_leader), [geoContacts]);

  const totalWithGeo = contacts.filter((c) => c.latitude && c.longitude).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar Filters */}
      <div className="w-64 border-r bg-card flex flex-col shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-base font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Georreferenciamento
          </h2>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block uppercase">Nome</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-7 h-9 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block uppercase">Categoria</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block uppercase">Liderança</label>
              <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {leadersList.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block uppercase">Sexo</label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block uppercase">Bairro</label>
              <Select value={filterNeighborhood} onValueChange={setFilterNeighborhood}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {neighborhoods.map((n) => (
                    <SelectItem key={n} value={n!}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block uppercase">Cidade</label>
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-[#2563eb] border-2 border-white shadow" />
              <span className="text-muted-foreground">Liderança</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-[#ec4899] border-2 border-white shadow" />
              <span className="text-muted-foreground">Eleitor/Contato</span>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-4">
            Geo Referenciamento é realizado por CEP e por aproximação. O número da localidade não é considerado.
          </p>
        </ScrollArea>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        {/* Stats bar */}
        <div className="absolute top-3 left-3 z-[1000] bg-card/95 backdrop-blur rounded-lg px-4 py-2 shadow-md border">
          <p className="text-sm">
            TOTAL DE CONTATOS: <strong>{filteredContacts.length}</strong>
            {" · "}
            COM GEOLOCALIZAÇÃO: <strong>{totalWithGeo}</strong>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Carregando mapa...</p>
          </div>
        ) : (
          <MapContainer
            center={[-15.78, -47.93]}
            zoom={5}
            className="h-full w-full"
            style={{ zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {geoContacts.length > 0 && <FitBounds contacts={geoContacts} />}

            {/* Leader pins (blue) */}
            {geoLeaders.map((leader) => {
              const voters = filteredContacts.filter((c) => c.leader_id === leader.id);
              return (
                <Marker
                  key={leader.id}
                  position={[leader.latitude!, leader.longitude!]}
                  icon={voters.length > 0 ? clusterIcon(voters.length, "#2563eb") : leaderIcon}
                >
                  <Popup maxWidth={350} minWidth={280}>
                    <div className="p-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div style={{ background: "#2563eb" }} className="text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0">
                          <Users size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{leader.name}</p>
                          <p className="text-xs text-gray-500">
                            {leader.address && `${leader.address}, `}{leader.neighborhood}{leader.city ? ` - ${leader.city}` : ""}
                          </p>
                        </div>
                      </div>

                      <Badge variant="secondary" className="mb-2">
                        {voters.length} eleitor{voters.length !== 1 ? "es" : ""} vinculado{voters.length !== 1 ? "s" : ""}
                      </Badge>

                      {voters.length > 0 && (
                        <div className="max-h-40 overflow-y-auto border rounded mt-1">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-2 py-1 text-left">Nome</th>
                                <th className="px-2 py-1 text-left">Telefone</th>
                              </tr>
                            </thead>
                            <tbody>
                              {voters.map((v) => (
                                <tr key={v.id} className="border-t">
                                  <td className="px-2 py-1">{v.nickname || v.name}</td>
                                  <td className="px-2 py-1">{v.phone || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Voter/Contact pins (pink) */}
            {geoVoters.map((voter) => (
              <Marker
                key={voter.id}
                position={[voter.latitude!, voter.longitude!]}
                icon={voterIcon}
              >
                <Popup maxWidth={300}>
                  <div className="p-1">
                    <p className="font-bold text-sm">{voter.name}</p>
                    {voter.nickname && <p className="text-xs text-gray-500">{voter.nickname}</p>}
                    <p className="text-xs text-gray-500">
                      {voter.address && `${voter.address}, `}{voter.neighborhood}{voter.city ? ` - ${voter.city}` : ""}
                    </p>
                    {voter.phone && <p className="text-xs mt-1">📞 {voter.phone}</p>}
                    {voter.category && <Badge variant="outline" className="mt-1 text-[10px]">{voter.category}</Badge>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

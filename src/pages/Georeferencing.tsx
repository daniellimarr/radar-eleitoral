import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const leaderIcon = new L.DivIcon({
  html: `<div style="background:#2563eb;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  </div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const clusterIcon = (count: number) =>
  new L.DivIcon({
    html: `<div style="background:#16a34a;color:white;border-radius:50%;width:${Math.min(50, 30 + count)}px;height:${Math.min(50, 30 + count)}px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${count > 99 ? 11 : 13}px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
      ${count}
    </div>`,
    className: "",
    iconSize: [Math.min(50, 30 + count), Math.min(50, 30 + count)],
    iconAnchor: [Math.min(25, 15 + count / 2), Math.min(50, 30 + count)],
    popupAnchor: [0, -(Math.min(50, 30 + count))],
  });

interface ContactWithGeo {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  city: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  is_leader: boolean | null;
  leader_id: string | null;
  category: string | null;
  gender: string | null;
}

interface LeaderPin {
  leaderId: string;
  leaderName: string;
  latitude: number;
  longitude: number;
  city: string | null;
  neighborhood: string | null;
  voters: ContactWithGeo[];
}

function FitBounds({ pins }: { pins: LeaderPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length > 0) {
      const bounds = L.latLngBounds(pins.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pins, map]);
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
        .select("id, name, nickname, phone, city, neighborhood, latitude, longitude, is_leader, leader_id, category, gender")
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

  const leaderPins = useMemo(() => {
    const leaders = filteredContacts.filter((c) => c.is_leader && c.latitude && c.longitude);
    return leaders.map((leader) => ({
      leaderId: leader.id,
      leaderName: leader.name,
      latitude: leader.latitude!,
      longitude: leader.longitude!,
      city: leader.city,
      neighborhood: leader.neighborhood,
      voters: filteredContacts.filter((c) => c.leader_id === leader.id),
    }));
  }, [filteredContacts]);

  const totalWithGeo = contacts.filter((c) => c.latitude && c.longitude).length;
  const leadersList = contacts.filter((c) => c.is_leader);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar Filters */}
      <div className="w-72 border-r bg-card flex flex-col shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Georreferenciamento
          </h2>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">NOME</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">LIDERANÇA</label>
              <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {leadersList.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CATEGORIA</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">SEXO</label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">BAIRRO</label>
              <Select value={filterNeighborhood} onValueChange={setFilterNeighborhood}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {neighborhoods.map((n) => (
                    <SelectItem key={n} value={n!}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CIDADE</label>
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Geo Referenciamento é realizado por coordenadas. Cadastre latitude e longitude nos contatos.
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
            {" · "}
            LIDERANÇAS NO MAPA: <strong>{leaderPins.length}</strong>
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
            {leaderPins.length > 0 && <FitBounds pins={leaderPins} />}

            {leaderPins.map((pin) => (
              <Marker
                key={pin.leaderId}
                position={[pin.latitude, pin.longitude]}
                icon={pin.voters.length > 0 ? clusterIcon(pin.voters.length) : leaderIcon}
              >
                <Popup maxWidth={350} minWidth={280}>
                  <div className="p-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{pin.leaderName}</p>
                        <p className="text-xs text-gray-500">
                          {pin.city}{pin.neighborhood ? ` - ${pin.neighborhood}` : ""}
                        </p>
                      </div>
                    </div>

                    <Badge variant="secondary" className="mb-2">
                      {pin.voters.length} eleitor{pin.voters.length !== 1 ? "es" : ""} vinculado{pin.voters.length !== 1 ? "s" : ""}
                    </Badge>

                    {pin.voters.length > 0 && (
                      <div className="max-h-40 overflow-y-auto border rounded mt-1">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-2 py-1 text-left">Nome</th>
                              <th className="px-2 py-1 text-left">Telefone</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pin.voters.map((v) => (
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
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

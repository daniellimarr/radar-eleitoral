import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Send, MessageCircle, Users, ArrowLeft, Smile } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const EMOJI_LIST = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😅", "😊",
  "👍", "👏", "🙌", "🤝", "💪", "🎉", "🔥", "❤️",
  "✅", "⭐", "🚀", "💬", "📌", "📊", "🗳️", "📢",
  "👋", "🙏", "😁", "😉", "🤩", "😄", "🫡", "💯",
];

interface ChatUser {
  user_id: string;
  full_name: string;
  role: string;
  location?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  otherUser: ChatUser;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export default function Chat() {
  const { user, tenantId, hasRole } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLeader = hasRole("operador");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Presence tracking
  useEffect(() => {
    if (!user || !tenantId) return;

    const presenceChannel = supabase.channel(`presence-chat-${tenantId}`, {
      config: { presence: { key: user.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const ids = new Set<string>(Object.keys(state));
        setOnlineUsers(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: user.id });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user, tenantId]);

  // Reset active conversation when leaving chat page
  useEffect(() => {
    return () => {
      setActiveConversation(null);
      setActiveUser(null);
      setMessages([]);
      setNewMessage("");
    };
  }, []);

  useEffect(() => {
    if (!tenantId || !user) return;

    const fetchUsers = async () => {
      // Leaders can chat with admins/coordinators
      // Admins/coordinators can chat with leaders (operadores)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("tenant_id", tenantId)
        .eq("status", "approved")
        .neq("user_id", user.id);

      if (!profiles) return;

      // Get roles for each profile
      const userIds = profiles.map(p => p.user_id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const roleMap: Record<string, string> = {};
      (roles || []).forEach(r => {
        // Keep highest role
        const priority: Record<string, number> = { super_admin: 5, admin_gabinete: 4, coordenador: 3, assessor: 2, operador: 1 };
        if (!roleMap[r.user_id] || (priority[r.role] || 0) > (priority[roleMap[r.user_id]] || 0)) {
          roleMap[r.user_id] = r.role;
        }
      });

      // Get leader locations for operadores
      const operadorIds = userIds.filter(id => roleMap[id] === "operador" || !roleMap[id]);
      const locationMap: Record<string, string> = {};
      if (operadorIds.length > 0) {
        // Leaders table links user via contact_id → contacts has neighborhood/city
        // But leaders table doesn't have user_id directly. We need to match by full_name
        // Actually, contacts.registered_by = user_id for operadores
        const { data: leaderContacts } = await supabase
          .from("contacts")
          .select("registered_by, neighborhood, city")
          .in("registered_by", operadorIds)
          .not("neighborhood", "is", null)
          .limit(100);

        if (leaderContacts) {
          // Get first contact's location per user as their area
          leaderContacts.forEach((c: any) => {
            if (c.registered_by && !locationMap[c.registered_by]) {
              locationMap[c.registered_by] = c.neighborhood || c.city || "";
            }
          });
        }

        // Also check leaders table → contacts for more accurate location
        const { data: leaders } = await supabase
          .from("leaders")
          .select("contact_id, tenant_id")
          .eq("tenant_id", tenantId);

        if (leaders && leaders.length > 0) {
          const contactIds = leaders.map((l: any) => l.contact_id);
          const { data: leaderContactData } = await supabase
            .from("contacts")
            .select("id, name, neighborhood, city, registered_by")
            .in("id", contactIds);

          if (leaderContactData) {
            // Match leader contact name to profile name to find user
            leaderContactData.forEach((c: any) => {
              // If this contact's registered_by matches an operador
              if (c.registered_by && operadorIds.includes(c.registered_by)) {
                locationMap[c.registered_by] = c.neighborhood || c.city || "";
              }
            });
          }
        }
      }

      const chatUsers: ChatUser[] = profiles
        .map(p => ({
          user_id: p.user_id,
          full_name: p.full_name || "Usuário",
          role: roleMap[p.user_id] || "operador",
          location: locationMap[p.user_id] || "",
        }))
        .filter(u => {
          if (isLeader) {
            return ["super_admin", "admin_gabinete", "coordenador"].includes(u.role);
          }
          return true;
        });

      setAvailableUsers(chatUsers);
    };

    fetchUsers();
  }, [tenantId, user, isLeader]);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      // Get all conversations the user participates in
      const { data: participations } = await supabase
        .from("chat_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (!participations || participations.length === 0) {
        setConversations([]);
        return;
      }

      const convIds = participations.map(p => p.conversation_id);

      // Get other participants
      const { data: allParticipants } = await supabase
        .from("chat_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", convIds)
        .neq("user_id", user.id);

      if (!allParticipants) return;

      const otherUserIds = [...new Set(allParticipants.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", otherUserIds);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", otherUserIds);

      const profileMap: Record<string, string> = {};
      (profiles || []).forEach(p => { profileMap[p.user_id] = p.full_name || "Usuário"; });

      const roleMap: Record<string, string> = {};
      (roles || []).forEach(r => { roleMap[r.user_id] = r.role; });

      // Get last messages and unread counts
      const convList: Conversation[] = [];
      for (const convId of convIds) {
        const otherParticipant = allParticipants.find(p => p.conversation_id === convId);
        if (!otherParticipant) continue;

        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("content, created_at")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: false })
          .limit(1);

        const { count: unread } = await supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", convId)
          .eq("is_read", false)
          .neq("sender_id", user.id);

        convList.push({
          id: convId,
          otherUser: {
            user_id: otherParticipant.user_id,
            full_name: profileMap[otherParticipant.user_id] || "Usuário",
            role: roleMap[otherParticipant.user_id] || "operador",
          },
          lastMessage: lastMsg?.[0]?.content,
          lastMessageAt: lastMsg?.[0]?.created_at,
          unreadCount: unread || 0,
        });
      }

      convList.sort((a, b) => {
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      setConversations(convList);
    };

    fetchConversations();
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", activeConversation)
        .order("created_at", { ascending: true });
      setMessages((data as Message[]) || []);

      // Mark as read
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("conversation_id", activeConversation)
        .eq("is_read", false)
        .neq("sender_id", user!.id);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${activeConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeConversation}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          // Mark as read if not from us
          if (newMsg.sender_id !== user!.id) {
            supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start or open conversation with a user
  const openConversation = async (chatUser: ChatUser) => {
    if (!user || !tenantId) return;

    // Check if conversation already exists
    const existing = conversations.find(c => c.otherUser.user_id === chatUser.user_id);
    if (existing) {
      setActiveConversation(existing.id);
      setActiveUser(chatUser);
      return;
    }

    // Create new conversation
    const { data: conv, error: convError } = await supabase
      .from("chat_conversations")
      .insert({ tenant_id: tenantId, created_by: user.id })
      .select()
      .single();

    if (convError || !conv) {
      toast.error("Erro ao criar conversa");
      return;
    }

    // Add participants
    await supabase.from("chat_participants").insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: chatUser.user_id },
    ]);

    setActiveConversation(conv.id);
    setActiveUser(chatUser);

    // Add to conversation list
    setConversations(prev => [{
      id: conv.id,
      otherUser: chatUser,
      unreadCount: 0,
    }, ...prev]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: activeConversation,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) {
        console.error("Error sending message:", error);
        toast.error("Erro ao enviar mensagem: " + error.message);
      } else {
        setNewMessage("");
      }
    } catch (err) {
      console.error("Unexpected error sending message:", err);
      toast.error("Erro inesperado ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      admin_gabinete: "Administrador",
      coordenador: "Coordenador",
      assessor: "Assessor",
      operador: "Liderança",
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    if (["super_admin", "admin_gabinete"].includes(role)) return "default" as const;
    if (role === "coordenador") return "secondary" as const;
    return "outline" as const;
  };

  const userName = user?.user_metadata?.full_name || user?.email || "Você";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Chat Interno</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className="text-sm font-medium">{userName}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        {/* Sidebar: Conversations + New chat */}
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Conversas</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            {/* Existing conversations */}
            <ScrollArea className="flex-1">
              {conversations.length === 0 && (
                <p className="text-sm text-muted-foreground px-4 py-3">Nenhuma conversa ainda</p>
              )}
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-b ${activeConversation === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  onClick={() => { setActiveConversation(conv.id); setActiveUser(conv.otherUser); }}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {conv.otherUser.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${onlineUsers.has(conv.otherUser.user_id) ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{conv.otherUser.full_name}</span>
                      {conv.unreadCount > 0 && (
                        <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    {conv.otherUser.location && conv.otherUser.role === "operador" && (
                      <p className="text-[10px] text-muted-foreground truncate">📍 {conv.otherUser.location}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage || "Nova conversa"}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>

            <Separator />

            {/* Available users to start new chat */}
            <div className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Users className="h-3 w-3" /> Iniciar nova conversa
              </p>
              <ScrollArea className="max-h-40">
                {availableUsers
                  .filter(u => !conversations.find(c => c.otherUser.user_id === u.user_id))
                  .map(u => (
                    <div
                      key={u.user_id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openConversation(u)}
                    >
                      <div className="relative">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
                            {u.full_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background ${onlineUsers.has(u.user_id) ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs truncate block">{u.full_name}</span>
                        {u.location && u.role === "operador" && (
                          <span className="text-[10px] text-muted-foreground truncate block">📍 {u.location}</span>
                        )}
                      </div>
                      <Badge variant={getRoleBadgeVariant(u.role)} className="text-[9px] px-1.5 py-0 shrink-0">
                        {getRoleLabel(u.role)}{u.location && u.role === "operador" ? ` · ${u.location}` : ""}
                      </Badge>
                    </div>
                  ))}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="md:col-span-2 flex flex-col">
          {activeConversation && activeUser ? (
            <>
              <CardHeader className="pb-3 border-b flex flex-row items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveConversation(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {activeUser.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${onlineUsers.has(activeUser.user_id) ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{activeUser.full_name}</CardTitle>
                    <span className={`text-[10px] ${onlineUsers.has(activeUser.user_id) ? "text-green-600" : "text-muted-foreground"}`}>
                      {onlineUsers.has(activeUser.user_id) ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant={getRoleBadgeVariant(activeUser.role)} className="text-[9px] px-1.5 py-0">
                      {getRoleLabel(activeUser.role)}
                    </Badge>
                    {activeUser.location && activeUser.role === "operador" && (
                      <span className="text-[10px] text-muted-foreground">📍 {activeUser.location}</span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Nenhuma mensagem ainda. Diga olá! 👋
                    </p>
                  )}
                  {messages.map((msg, i) => {
                    const isMine = msg.sender_id === user?.id;
                    const showDate = i === 0 || format(new Date(messages[i - 1].created_at), "yyyy-MM-dd") !== format(new Date(msg.created_at), "yyyy-MM-dd");

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-3">
                            <span className="text-[10px] bg-muted px-3 py-1 rounded-full text-muted-foreground">
                              {format(new Date(msg.created_at), "dd 'de' MMMM", { locale: ptBR })}
                            </span>
                          </div>
                        )}
                        <div className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {format(new Date(msg.created_at), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </ScrollArea>

                <div className="p-3 border-t flex gap-2 items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <Smile className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start" side="top">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_LIST.map((emoji) => (
                          <button
                            key={emoji}
                            className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted text-lg transition-colors"
                            onClick={() => setNewMessage(prev => prev + emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    disabled={sending}
                  />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon" className="shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Selecione uma conversa ou inicie uma nova</p>
              <p className="text-xs mt-1">
                {isLeader
                  ? "Converse diretamente com coordenadores e administradores"
                  : "Converse com as lideranças e equipe"}
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

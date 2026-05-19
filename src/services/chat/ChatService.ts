import { supabase } from "@/integrations/supabase/client";

export class ChatService {
  static async fetchAvailableUsers(tenantId: string, currentUserId: string) {
    const { data: profiles } = await supabase
      .from("profiles_safe")
      .select("user_id, full_name")
      .eq("tenant_id", tenantId)
      .eq("status", "approved")
      .neq("user_id", currentUserId);

    if (!profiles || profiles.length === 0) return [];

    const userIds = profiles.map(p => p.user_id);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    const roleMap: Record<string, string> = {};
    (roles || []).forEach(r => {
      const priority: Record<string, number> = { super_admin: 5, admin_gabinete: 4, coordenador: 3, assessor: 2, operador: 1 };
      if (!roleMap[r.user_id] || (priority[r.role] || 0) > (priority[roleMap[r.user_id]] || 0)) {
        roleMap[r.user_id] = r.role;
      }
    });

    return profiles.map(p => ({
      user_id: p.user_id,
      full_name: p.full_name || "Usuário",
      role: roleMap[p.user_id] || "operador",
    }));
  }

  static async fetchConversations(currentUserId: string) {
    const { data: participations } = await supabase
      .from("chat_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    if (!participations || participations.length === 0) return [];

    const convIds = participations.map(p => p.conversation_id);
    const { data: allParticipants } = await supabase
      .from("chat_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds)
      .neq("user_id", currentUserId);

    return allParticipants || [];
  }

  static async createConversation(tenantId: string, currentUserId: string, otherUserId: string) {
    const { data: conv, error: convError } = await supabase
      .from("chat_conversations")
      .insert({ tenant_id: tenantId, created_by: currentUserId })
      .select()
      .single();

    if (convError || !conv) return { error: convError };

    await supabase.from("chat_participants").insert([
      { conversation_id: conv.id, user_id: currentUserId },
      { conversation_id: conv.id, user_id: otherUserId },
    ]);

    return { data: conv };
  }

  static async sendMessage(conversationId: string, senderId: string, content: string) {
    return supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim(),
    });
  }

  static async markAsRead(conversationId: string, currentUserId: string) {
    return supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("is_read", false)
      .neq("sender_id", currentUserId);
  }

  static async deleteConversation(conversationId: string) {
    await supabase.from("chat_messages").delete().eq("conversation_id", conversationId);
    await supabase.from("chat_participants").delete().eq("conversation_id", conversationId);
    return supabase.from("chat_conversations").delete().eq("id", conversationId);
  }
}

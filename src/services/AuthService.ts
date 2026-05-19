import { supabase } from "@/integrations/supabase/client";

// Cache simples para evitar múltiplas requisições de perfil/roles no mesmo ciclo
const authCache = {
  profile: null as any,
  roles: null as string[] | null,
  userId: null as string | null
};

export class AuthService {
  static async getProfile(userId: string) {
    if (authCache.userId === userId && authCache.profile) {
      return { data: authCache.profile, error: null };
    }
    
    const res = await supabase
      .from("profiles_safe")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
      
    if (res.data) {
      authCache.userId = userId;
      authCache.profile = res.data;
    }
    return res;
  }

  static async getRoles(userId: string) {
    if (authCache.userId === userId && authCache.roles) {
      return { data: authCache.roles.map(r => ({ role: r })), error: null };
    }

    const res = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
      
    if (res.data) {
      authCache.userId = userId;
      authCache.roles = res.data.map((r: any) => r.role);
    }
    return res;
  }

  static async getPermissions(userId: string, tenantId: string) {
    // Permissões mudam com frequência dependendo do tenant, cache mais complexo
    return supabase
      .from("user_permissions")
      .select("user_id, module") // Adicionando user_id para consistência
      .in("user_id", [userId])
      .eq("tenant_id", tenantId);
  }

  static async signIn(email: string, password: string) {
    this.clearCache();
    return supabase.auth.signInWithPassword({ email, password });
  }

  static async signUp(email: string, password: string, fullName: string) {
    this.clearCache();
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
  }

  static async signOut() {
    this.clearCache();
    return supabase.auth.signOut();
  }

  static clearCache() {
    authCache.profile = null;
    authCache.roles = null;
    authCache.userId = null;
  }

  static async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
  }
}

import { supabase } from "@/integrations/supabase/client";

export class AuthService {
  static async getProfile(userId: string) {
    return supabase
      .from("profiles_safe")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
  }

  static async getRoles(userId: string) {
    return supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
  }

  static async getPermissions(userId: string, tenantId: string) {
    return supabase
      .from("user_permissions")
      .select("module")
      .eq("user_id", userId)
      .eq("tenant_id", tenantId);
  }

  static async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  static async signUp(email: string, password: string, fullName: string) {
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
    return supabase.auth.signOut();
  }

  static async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
  }
}

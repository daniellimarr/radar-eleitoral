import { BaseService } from "./BaseService";
import { Profile, UserRole, UserPermission } from "@/types/auth";

const authCache = {
  profile: null as Profile | null,
  roles: null as string[] | null,
  userId: null as string | null
};

export class AuthService extends BaseService {
  static async getProfile(userId: string) {
    if (authCache.userId === userId && authCache.profile) {
      return { data: authCache.profile, error: null };
    }
    
    const client = this.getClient();
    const res = await client
      .from("profiles_safe")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
      
    if (res.data) {
      authCache.userId = userId;
      authCache.profile = res.data as Profile;
    }
    return res;
  }

  static async getRoles(userId: string) {
    if (authCache.userId === userId && authCache.roles) {
      return { data: authCache.roles.map(r => ({ role: r })), error: null };
    }

    const client = this.getClient();
    const res = await client
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
    return this.getClient()
      .from("user_permissions")
      .select("user_id, module")
      .in("user_id", [userId])
      .eq("tenant_id", tenantId);
  }

  static async signIn(email: string, password: string) {
    this.clearCache();
    return this.getClient().auth.signInWithPassword({ email, password });
  }

  static async signUp(email: string, password: string, fullName: string) {
    this.clearCache();
    return this.getClient().auth.signUp({
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
    return this.getClient().auth.signOut();
  }

  static clearCache() {
    authCache.profile = null;
    authCache.roles = null;
    authCache.userId = null;
  }

  static async resetPassword(email: string) {
    return this.getClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
  }
}

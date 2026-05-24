import { createContext, useContext, useEffect, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthService } from "@/services/AuthService";
import { useSession } from "./auth/useSession";
import { useProfile } from "./auth/useProfile";
import { usePermissions } from "./auth/usePermissions";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: any;
  roles: string[];
  tenantId: string | null;
  userPermissions: string[];
  permissionsLoading: boolean;
  profileStatus: string | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (password: string) => Promise<any>;
  hasRole: (role: string) => boolean;
  hasPermission: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, session, loading: sessionLoading } = useSession();
  const { profile, tenantId, profileStatus, loading: profileLoading, fetchProfile, clearProfile } = useProfile();
  const { roles, userPermissions, loading: permissionsLoading, fetchPermissions, clearPermissions } = usePermissions();

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    } else {
      clearProfile();
      clearPermissions();
    }
  }, [user, fetchProfile, clearProfile, clearPermissions]);

  useEffect(() => {
    if (user && profile) {
      fetchPermissions(user.id, tenantId);
    }
  }, [user, profile, tenantId, fetchPermissions]);

  const hasRole = useCallback((role: string) => {
    return roles.some(r => r.toLowerCase() === role.toLowerCase());
  }, [roles]);
  
  const hasPermission = useCallback((module: string) => {
    if (!user) return false;
    if (roles.includes('super_admin') || roles.includes('admin_gabinete')) return true;
    if (profileStatus !== 'approved') return false;
    if (userPermissions && userPermissions.length > 0) {
      return userPermissions.includes(module);
    }
    const defaultModules = ['dashboard', 'contacts', 'demands', 'appointments'];
    return defaultModules.includes(module);
  }, [user, profileStatus, roles, userPermissions]);

  const signIn = async (email: string, password: string) => {
    AuthService.clearCache();
    return AuthService.signIn(email, password);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    AuthService.clearCache();
    return AuthService.signUp(email, password, fullName);
  };

  const signOut = async () => {
    AuthService.clearCache();
    await AuthService.signOut();
  };

  const resetPassword = async (email: string) => {
    return AuthService.resetPassword(email);
  };

  const updatePassword = async (password: string) => {
    return supabase.auth.updateUser({ password });
  };

  const value = {
    user,
    session,
    loading: sessionLoading || profileLoading,
    profile,
    roles,
    tenantId,
    userPermissions,
    permissionsLoading,
    profileStatus,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    hasRole,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

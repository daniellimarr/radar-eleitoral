import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthService } from "@/services/AuthService";

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
  hasRole: (role: string) => boolean;
  hasPermission: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setProfile(null);
    setRoles([]);
    setTenantId(null);
    setUserPermissions([]);
    setProfileStatus(null);
    setPermissionsLoading(false);
    setLoading(false);
  }, []);

  const fetchAuthData = useCallback(async (userId: string) => {
    try {
      setPermissionsLoading(true);
      const { data: profileData, error: profileError } = await AuthService.getProfile(userId);
      
      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData);
        setTenantId(profileData.tenant_id);
        setProfileStatus(profileData.status || 'pending');

        const [rolesRes, permsRes] = await Promise.all([
          AuthService.getRoles(userId),
          profileData.tenant_id ? AuthService.getPermissions(userId, profileData.tenant_id) : Promise.resolve({ data: [] })
        ]);
        
        setRoles(rolesRes.data?.map((r: any) => r.role) || []);
        setUserPermissions(permsRes.data?.map((p: any) => p.module) || []);
      } else {
        resetState();
      }
    } catch (error) {
      console.error("Error fetching auth data:", error);
      resetState();
    } finally {
      setPermissionsLoading(false);
      setLoading(false);
    }
  }, [resetState]);

  useEffect(() => {
    let isSubscribed = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!isSubscribed) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          fetchAuthData(currentSession.user.id);
        } else {
          resetState();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isSubscribed) return;
      
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        fetchAuthData(initialSession.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [fetchAuthData, resetState]);

  const hasRole = (role: string) => roles.includes(role);
  
  const hasPermission = (module: string) => {
    if (roles.includes("super_admin") || roles.includes("admin_gabinete")) return true;
    return userPermissions.includes(module);
  };

  const signIn = async (email: string, password: string) => {
    return AuthService.signIn(email, password);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    return AuthService.signUp(email, password, fullName);
  };

  const signOut = async () => {
    await AuthService.signOut();
  };

  const value = {
    user,
    session,
    loading,
    profile,
    roles,
    tenantId,
    userPermissions,
    permissionsLoading,
    profileStatus,
    signIn,
    signUp,
    signOut,
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

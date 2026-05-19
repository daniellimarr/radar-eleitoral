import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionContextType {
  subscribed: boolean;
  loading: boolean;
  planName: string | null;
  subscriptionEnd: string | null;
  contactLimit: number;
  userLimit: number;
  durationDays: number;
  hasPremiumModules: boolean;
  expired: boolean;
  expiredAt: string | null;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscribed: true,
  loading: false,
  planName: "Acesso Total",
  subscriptionEnd: null,
  contactLimit: Infinity,
  userLimit: Infinity,
  durationDays: Infinity,
  hasPremiumModules: true,
  expired: false,
  expiredAt: null,
  checkSubscription: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, roles, loading: authLoading } = useAuth();
  const [subscribed, setSubscribed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [planName, setPlanName] = useState<string | null>("Acesso Total");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [contactLimit, setContactLimit] = useState(Infinity);
  const [userLimit, setUserLimit] = useState(Infinity);
  const [durationDays, setDurationDays] = useState(Infinity);
  const [hasPremiumModules, setHasPremiumModules] = useState(true);
  const [expired, setExpired] = useState(false);
  const [expiredAt, setExpiredAt] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Obter tenant_id do usuário
      const { data: profileData } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData?.tenant_id) {
        // Obter detalhes do plano via tenant
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("*, plans(*)")
          .eq("id", profileData.tenant_id)
          .maybeSingle();

        if (tenantData) {
          const plan = (tenantData as any).plans;
          if (plan) {
            setPlanName(plan.name);
            setContactLimit(plan.contact_limit || (tenantData as any).contact_limit || Infinity);
            setUserLimit(plan.user_limit || Infinity);
            setHasPremiumModules(plan.has_premium_modules || false);
            setDurationDays(plan.duration_days || Infinity);
          }
          
          // Verificar status da assinatura real
          const { data: subData } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("tenant_id", profileData.tenant_id)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (subData) {
            setSubscriptionEnd(subData.expires_at);
            setSubscribed(true);
            setExpired(subData.expires_at ? new Date(subData.expires_at) < new Date() : false);
            setExpiredAt(subData.expires_at);
          } else {
            // Fallback se não houver registro na tabela subscriptions mas o tenant estiver ativo
            setSubscribed((tenantData as any).status === 'ativo');
          }
        }
      }
    } catch (err) {
      console.error("Erro ao verificar assinatura:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !authLoading) {
      checkSubscription();
    }
  }, [user, authLoading, checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ 
      subscribed, 
      loading, 
      planName, 
      subscriptionEnd, 
      contactLimit, 
      userLimit, 
      durationDays, 
      hasPremiumModules, 
      expired, 
      expiredAt, 
      checkSubscription 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
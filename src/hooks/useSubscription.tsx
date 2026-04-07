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
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscribed: false,
  loading: true,
  planName: null,
  subscriptionEnd: null,
  contactLimit: 5000,
  userLimit: 5,
  durationDays: 30,
  hasPremiumModules: false,
  checkSubscription: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session, roles, loading: authLoading } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [contactLimit, setContactLimit] = useState(5000);
  const [userLimit, setUserLimit] = useState(5);
  const [durationDays, setDurationDays] = useState(30);
  const [hasPremiumModules, setHasPremiumModules] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setSubscribed(false);
      setLoading(false);
      return;
    }

    if (authLoading) return;

    if (roles.includes("super_admin")) {
      setSubscribed(true);
      setPlanName("Super Admin");
      setContactLimit(Infinity);
      setUserLimit(Infinity);
      setDurationDays(Infinity);
      setHasPremiumModules(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      setSubscribed(data.subscribed || false);
      setSubscriptionEnd(data.subscription_end || null);
      setPlanName(data.plan_name || null);
      setContactLimit(data.contact_limit ?? 5000);
      setUserLimit(data.user_limit ?? 5);
      setDurationDays(data.duration_days ?? 30);
      setHasPremiumModules(data.has_premium_modules ?? false);
    } catch (err) {
      console.error("Error checking subscription:", err);
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [session, roles, authLoading]);

  useEffect(() => {
    if (session) {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [session, checkSubscription]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ subscribed, loading, planName, subscriptionEnd, contactLimit, userLimit, durationDays, hasPremiumModules, checkSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);

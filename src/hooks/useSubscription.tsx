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
  subscribed: false,
  loading: true,
  planName: null,
  subscriptionEnd: null,
  contactLimit: 5000,
  userLimit: 5,
  durationDays: 30,
  hasPremiumModules: false,
  expired: false,
  expiredAt: null,
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
  const [expired, setExpired] = useState(false);
  const [expiredAt, setExpiredAt] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setSubscribed(false);
      setLoading(false);
      return;
    }

    if (authLoading) return;

    // Default to subscribed (Zero-Trust/Internal Plan)
    setSubscribed(true);
    setPlanName("Plano Ativo");
    setContactLimit(Infinity);
    setUserLimit(Infinity);
    setDurationDays(Infinity);
    setHasPremiumModules(true);
    setExpired(false);
    setExpiredAt(null);
    setLoading(false);
  }, [session, authLoading]);

  useEffect(() => {
    if (session) {
      setLoading(true);
      checkSubscription();
    } else {
      setSubscribed(false);
      setLoading(false);
    }
  }, [session, checkSubscription]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ subscribed, loading, planName, subscriptionEnd, contactLimit, userLimit, durationDays, hasPremiumModules, expired, expiredAt, checkSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);

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
  const { user, session, roles, loading: authLoading } = useAuth();
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
    // Subscription check disabled as all authenticated users have access
    setSubscribed(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ subscribed, loading, planName, subscriptionEnd, contactLimit, userLimit, durationDays, hasPremiumModules, expired, expiredAt, checkSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
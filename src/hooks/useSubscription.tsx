import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPlanLimits } from "@/lib/stripe";

interface SubscriptionContextType {
  subscribed: boolean;
  loading: boolean;
  planName: string | null;
  subscriptionEnd: string | null;
  contactLimit: number;
  userLimit: number;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscribed: false,
  loading: true,
  planName: null,
  subscriptionEnd: null,
  contactLimit: 5000,
  userLimit: 2,
  checkSubscription: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session, roles } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [contactLimit, setContactLimit] = useState(5000);
  const [userLimit, setUserLimit] = useState(2);

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setSubscribed(false);
      setLoading(false);
      return;
    }

    // Only super_admin bypasses subscription check
    if (roles.includes("super_admin")) {
      setSubscribed(true);
      setPlanName("Super Admin");
      setContactLimit(Infinity);
      setUserLimit(Infinity);
      setLoading(false);
      return;
    }

    // If roles haven't loaded yet, keep loading=true and wait
    if (roles.length === 0) {
      setLoading(true);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      setSubscribed(data.subscribed || false);
      setSubscriptionEnd(data.subscription_end || null);

      if (data.plan_name) {
        setPlanName(data.plan_name);
        const limits = getPlanLimits(data.plan_name);
        setContactLimit(limits.contact_limit);
        setUserLimit(limits.user_limit);
      } else {
        setPlanName(null);
        setContactLimit(5000);
        setUserLimit(2);
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [session, roles]);

  useEffect(() => {
    if (session) {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [session, checkSubscription]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ subscribed, loading, planName, subscriptionEnd, contactLimit, userLimit, checkSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);

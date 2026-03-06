import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPlanByProductId, getPlanByPriceId } from "@/lib/stripe";

interface SubscriptionContextType {
  subscribed: boolean;
  loading: boolean;
  planName: string | null;
  subscriptionEnd: string | null;
  productId: string | null;
  priceId: string | null;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscribed: false,
  loading: true,
  planName: null,
  subscriptionEnd: null,
  productId: null,
  priceId: null,
  checkSubscription: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session, roles } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [priceId, setPriceId] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setSubscribed(false);
      setLoading(false);
      return;
    }

    // Super admins bypass subscription check
    if (roles.includes("super_admin")) {
      setSubscribed(true);
      setPlanName("Super Admin");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      setSubscribed(data.subscribed || false);
      setProductId(data.product_id || null);
      setPriceId(data.price_id || null);
      setSubscriptionEnd(data.subscription_end || null);

      if (data.product_id) {
        const plan = getPlanByProductId(data.product_id);
        setPlanName(plan?.name || null);
      } else {
        setPlanName(null);
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
    <SubscriptionContext.Provider value={{ subscribed, loading, planName, subscriptionEnd, productId, priceId, checkSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);

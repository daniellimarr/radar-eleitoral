import { createContext, useContext, ReactNode } from "react";

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
  planName: "Gabinete",
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
  const value = {
    subscribed: true,
    loading: false,
    planName: "Gabinete",
    subscriptionEnd: null,
    contactLimit: Infinity,
    userLimit: Infinity,
    durationDays: Infinity,
    hasPremiumModules: true,
    expired: false,
    expiredAt: null,
    checkSubscription: async () => {},
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);

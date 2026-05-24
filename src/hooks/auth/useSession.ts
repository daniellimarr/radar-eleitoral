import { useState, useCallback, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isSubscribed) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!isSubscribed) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, loading };
}

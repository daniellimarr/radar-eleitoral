import { useState, useCallback } from "react";
import { AuthService } from "@/services/AuthService";
import { Profile } from "@/types/auth";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await AuthService.getProfile(userId);
      if (error) throw error;
      if (data) {
        setProfile(data as Profile);
        setTenantId(data.tenant_id);
        setProfileStatus(data.status || 'pending');
      } else {
        setProfile(null);
        setTenantId(null);
        setProfileStatus(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      setTenantId(null);
      setProfileStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
    setTenantId(null);
    setProfileStatus(null);
  }, []);

  return { profile, tenantId, profileStatus, loading, fetchProfile, clearProfile };
}

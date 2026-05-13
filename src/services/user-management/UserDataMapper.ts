import { UserRow } from "@/types/user-management";
import { UserService } from "./UserService";

export class UserDataMapper {
  static async fetchAllUsers(tenantId: string): Promise<UserRow[]> {
    const [profilesRes, pendingRes] = await Promise.all([
      UserService.fetchTenantProfiles(tenantId),
      UserService.fetchPendingProfiles()
    ]);

    const allProfiles = [...(profilesRes.data || []), ...(pendingRes.data || [])];
    if (allProfiles.length === 0) return [];

    const userIds = allProfiles.map(p => p.user_id);
    const [rolesRes, permsRes] = await Promise.all([
      UserService.fetchUsersRoles(userIds),
      UserService.fetchUsersPermissions(userIds, tenantId)
    ]);

    const rolesMap = new Map(rolesRes.data?.map(r => [r.user_id, r.role]));
    const permsMap = new Map<string, string[]>();
    
    permsRes.data?.forEach(p => {
      if (!permsMap.has(p.user_id)) permsMap.set(p.user_id, []);
      permsMap.get(p.user_id)!.push(p.module);
    });

    return allProfiles.map((p: any) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      email: p.email || "",
      role: rolesMap.get(p.user_id) || null,
      modules: permsMap.get(p.user_id) || [],
      status: p.status || "approved",
    }));
  }
}

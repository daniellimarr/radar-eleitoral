// Helper extracted for unit testing.
// Verifies that the caller has at least one of the allowed admin roles.
// Uses a plain query interface so tests can inject a fake client without
// pulling in the real supabase-js runtime.

export interface RoleRow {
  role: string;
}

export interface RoleQueryClient {
  from(table: "user_roles"): {
    select(cols: string): {
      eq(col: "user_id", val: string): {
        in(col: "role", vals: string[]): Promise<{
          data: RoleRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

export const ADMIN_ROLES = ["super_admin", "developer"] as const;

export async function isAuthorizedAdmin(
  client: RoleQueryClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", [...ADMIN_ROLES]);

  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

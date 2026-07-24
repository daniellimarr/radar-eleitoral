import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  isAuthorizedAdmin,
  RoleQueryClient,
  RoleRow,
} from "./authorize.ts";

function makeClient(
  rows: RoleRow[] | null,
  error: { message: string } | null = null,
): { client: RoleQueryClient; calls: { userId?: string; roles?: string[] } } {
  const calls: { userId?: string; roles?: string[] } = {};
  const client: RoleQueryClient = {
    from() {
      return {
        select() {
          return {
            eq(_col, userId) {
              calls.userId = userId;
              return {
                in(_c, vals) {
                  calls.roles = vals;
                  return Promise.resolve({ data: rows, error });
                },
              };
            },
          };
        },
      };
    },
  };
  return { client, calls };
}

Deno.test("isAuthorizedAdmin: user with multiple admin roles is authorized", async () => {
  const { client, calls } = makeClient([
    { role: "super_admin" },
    { role: "developer" },
  ]);
  const ok = await isAuthorizedAdmin(client, "user-1");
  assertEquals(ok, true);
  assertEquals(calls.userId, "user-1");
  assertEquals(calls.roles, ["super_admin", "developer"]);
});

Deno.test("isAuthorizedAdmin: user with single admin role is authorized", async () => {
  const { client } = makeClient([{ role: "super_admin" }]);
  assertEquals(await isAuthorizedAdmin(client, "u"), true);
});

Deno.test("isAuthorizedAdmin: no rows returned is unauthorized", async () => {
  const { client } = makeClient([]);
  assertEquals(await isAuthorizedAdmin(client, "u"), false);
});

Deno.test("isAuthorizedAdmin: null data is unauthorized", async () => {
  const { client } = makeClient(null);
  assertEquals(await isAuthorizedAdmin(client, "u"), false);
});

Deno.test("isAuthorizedAdmin: query error is unauthorized", async () => {
  const { client } = makeClient(null, { message: "boom" });
  assertEquals(await isAuthorizedAdmin(client, "u"), false);
});

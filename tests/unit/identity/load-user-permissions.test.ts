import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadUserPermissions } from "@/lib/platform/identity/permissions";

function mockQuery(result: { data: unknown; error?: { message: string } | null }) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.in = vi.fn(chain);
  builder.limit = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.maybeSingle = vi.fn(async () => result);
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

describe("loadUserPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads permissions in a bounded number of queries (no per-key RPC)", async () => {
    const from = vi.fn((table: string) => {
      if (table === "user_roles") {
        return mockQuery({ data: [{ role_id: "role-1" }] });
      }
      if (table === "roles") {
        return mockQuery({ data: [{ name: "FOUNDER" }] });
      }
      if (table === "platform_role_permissions") {
        return mockQuery({
          data: [
            { permission_key: "org.view", effect: "allow" },
            { permission_key: "secret.denied", effect: "deny" },
          ],
        });
      }
      return mockQuery({ data: [] });
    });

    const rpc = vi.fn(async (name: string) => {
      if (name === "user_role_ids") return { data: ["role-1"], error: null };
      if (name === "has_permission") {
        throw new Error("has_permission must not be called per catalog key");
      }
      return { data: null, error: null };
    });

    const supabase = {
      from,
      rpc,
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
    } as never;

    const permissions = await loadUserPermissions(supabase, "user-1", "user-1");

    expect(permissions.has("org.view")).toBe(true);
    expect(permissions.has("JAG_ACCESS")).toBe(true); // FOUNDER mapping
    expect(rpc).not.toHaveBeenCalledWith(
      "has_permission",
      expect.anything()
    );
    // Bounded: user_roles + roles + platform_role_permissions (rpc user_role_ids once)
    expect(from.mock.calls.filter(([t]) => t === "user_roles").length).toBeLessThanOrEqual(2);
    expect(from.mock.calls.filter(([t]) => t === "platform_role_permissions").length).toBe(1);
  });
});

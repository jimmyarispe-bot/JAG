import { describe, expect, it } from "vitest";
import {
  parseUserCsv,
} from "@/lib/platform/identity/user-management";
import {
  resolveUserManagementRole,
  resolveUserManagementStatus,
  USER_CSV_TEMPLATE,
} from "@/lib/platform/identity/user-management-catalog";

describe("user-management catalog", () => {
  it("resolves onboarding role labels", () => {
    expect(resolveUserManagementRole("Founder")).toBe("FOUNDER");
    expect(resolveUserManagementRole("Executive Director of Schools")).toBe(
      "EXECUTIVE_DIRECTOR"
    );
    expect(resolveUserManagementRole("Administrator")).toBe("ADMINISTRATOR");
    expect(resolveUserManagementRole("School Leader")).toBe("SCHOOL_LEADER");
  });

  it("resolves statuses", () => {
    expect(resolveUserManagementStatus("Pending Invite")).toBe("pending_invite");
    expect(resolveUserManagementStatus("Active")).toBe("active");
    expect(resolveUserManagementStatus("Inactive")).toBe("inactive");
  });

  it("parses the CSV template used for onboarding", () => {
    const rows = parseUserCsv(USER_CSV_TEMPLATE);
    expect(rows).toHaveLength(4);
    expect(rows[0]?.firstName).toBe("Jimmy");
    expect(rows[1]?.lastName).toBe("Treu");
    expect(rows[2]?.role).toBe("Administrator");
    expect(rows[3]?.firstName).toBe("Heather");
  });
});

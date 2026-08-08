/**
 * Phase 65E — searchParams → workspace/org request helpers.
 */

import { describe, expect, it } from "vitest";
import {
  JAG_ORG_HEADER,
  JAG_WORKSPACE_HEADER,
  orgParamFromRequestHeaders,
  orgParamFromSearchParams,
  workspaceParamFromRequestHeaders,
  workspaceParamFromSearchParams,
} from "@/lib/jag-platform/workspace-request";

describe("workspace-request searchParams helpers", () => {
  it("reads workspace from page searchParams object", () => {
    expect(
      workspaceParamFromSearchParams({ workspace: "platform", org: "org.a" })
    ).toBe("platform");
    expect(workspaceParamFromSearchParams({ org: "org.a" })).toBeNull();
    expect(workspaceParamFromSearchParams({ workspace: "  " })).toBeNull();
  });

  it("reads workspace from URLSearchParams", () => {
    const sp = new URLSearchParams("workspace=platform&org=org.a");
    expect(workspaceParamFromSearchParams(sp)).toBe("platform");
    expect(orgParamFromSearchParams(sp)).toBe("org.a");
  });

  it("reads mirrored headers set from searchParams", () => {
    const headers = new Headers();
    headers.set(JAG_WORKSPACE_HEADER, "platform");
    headers.set(JAG_ORG_HEADER, "org.academy-way");
    expect(workspaceParamFromRequestHeaders(headers)).toBe("platform");
    expect(orgParamFromRequestHeaders(headers)).toBe("org.academy-way");
  });

  it("treats empty mirrored headers as absent", () => {
    const headers = new Headers();
    headers.set(JAG_WORKSPACE_HEADER, "");
    headers.set(JAG_ORG_HEADER, "");
    expect(workspaceParamFromRequestHeaders(headers)).toBeNull();
    expect(orgParamFromRequestHeaders(headers)).toBeNull();
  });
});

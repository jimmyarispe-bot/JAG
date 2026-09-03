/**
 * Signing the enrollment packet is the moment a family becomes a student and a
 * bill.
 *
 * `signEnrollmentDocument` decided the packet was complete with:
 *
 *   const allSigned = [...requiredKeys].every((k) => signedKeys.has(k));
 *
 * `.every()` on an empty set is `true`. So any read that came back empty — an
 * RLS refusal, a school with no templates, the old `school_id ?? ""` fallback —
 * marked the packet "completed" on the FIRST signature. That passed
 * completeEnrollmentHandoff's gate, which created a student, a family billing
 * account and an invoice for a family that had signed nothing.
 *
 * These tests pin the two properties that make that impossible to reintroduce:
 * a packet we cannot enumerate never completes, and an enrollment that produced
 * no invoice says so out loud.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

const completeEnrollmentHandoff = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/admissions/handoff/complete-enrollment-handoff", () => ({
  completeEnrollmentHandoff: (...args: unknown[]) => completeEnrollmentHandoff(...args),
}));

const createAuthClient = vi.fn();
vi.mock("@/lib/supabase/server-auth", () => ({
  createAuthClient: () => createAuthClient(),
}));

const PACKET = { id: "packet-1", school_id: "school-1", lead_id: "lead-1" };

type TableResult = { data?: unknown; error?: unknown };

interface Recorded {
  table: string;
  op: "insert" | "update";
  payload: Record<string, unknown>;
}

function makeClient(results: Record<string, TableResult>) {
  const writes: Recorded[] = [];

  function builder(table: string) {
    const result = () => results[table] ?? { data: null, error: null };
    // Every method returns the builder; the builder is thenable, so `await`
    // anywhere in the chain resolves to this table's configured result.
    const b: Record<string, unknown> = {
      select: () => b,
      eq: () => b,
      order: () => b,
      limit: () => b,
      insert: (payload: Record<string, unknown>) => {
        writes.push({ table, op: "insert", payload });
        return b;
      },
      update: (payload: Record<string, unknown>) => {
        writes.push({ table, op: "update", payload });
        return b;
      },
      single: async () => result(),
      maybeSingle: async () => result(),
      then: (res: (v: TableResult) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve(result()).then(res, rej),
    };
    return b;
  }

  return { client: { from: (t: string) => builder(t) }, writes };
}

function form(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("enrollment_packet_id", PACKET.id);
  fd.set("template_key", "enrollment_agreement");
  fd.set("signer_name", "Scott Fitzgerald");
  fd.set("signer_email", "scott@example.com");
  fd.set("signature_text", "Scott Fitzgerald");
  fd.set("application_id", "app-1");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

async function sign(fd: FormData) {
  const mod = await import("@/lib/admissions/enrollment-packets");
  return mod.signEnrollmentDocument(fd);
}

function completedPacket(writes: Recorded[]) {
  return writes.some(
    (w) =>
      w.table === "enrollment_packets" &&
      w.op === "update" &&
      w.payload.packet_status === "completed"
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  completeEnrollmentHandoff.mockResolvedValue({ success: true, studentId: "stu-1" });
});

describe("a packet we cannot enumerate never completes", () => {
  it("refuses when the school has no active enrollment documents", async () => {
    const { client, writes } = makeClient({
      enrollment_packets: { data: PACKET },
      enrollment_packet_templates: { data: [], error: null },
      enrollment_packet_signatures: { data: [], error: null },
    });
    createAuthClient.mockResolvedValue(client);

    const result = await sign(form());

    // An empty required set used to mean "everything is signed".
    expect(result).toHaveProperty("error");
    expect(completedPacket(writes)).toBe(false);
    expect(completeEnrollmentHandoff).not.toHaveBeenCalled();
  });

  it("refuses when the template read itself fails", async () => {
    const { client, writes } = makeClient({
      enrollment_packets: { data: PACKET },
      enrollment_packet_templates: { data: null, error: { message: "permission denied" } },
      enrollment_packet_signatures: { data: [], error: null },
    });
    createAuthClient.mockResolvedValue(client);

    const result = await sign(form());

    // An RLS refusal is not consent.
    expect(result).toHaveProperty("error");
    expect(completedPacket(writes)).toBe(false);
    expect(completeEnrollmentHandoff).not.toHaveBeenCalled();
  });

  it("refuses when the packet itself cannot be found", async () => {
    const { client, writes } = makeClient({
      enrollment_packets: { data: null },
      enrollment_packet_templates: { data: [], error: null },
      enrollment_packet_signatures: { data: [], error: null },
    });
    createAuthClient.mockResolvedValue(client);

    const result = await sign(form());

    expect(result).toHaveProperty("error");
    expect(completedPacket(writes)).toBe(false);
  });

  it("still records the signature before it refuses", async () => {
    // The family did sign something. Losing that because the packet is
    // misconfigured would make them sign it twice.
    const { client, writes } = makeClient({
      enrollment_packets: { data: PACKET },
      enrollment_packet_templates: { data: [], error: null },
      enrollment_packet_signatures: { data: [], error: null },
    });
    createAuthClient.mockResolvedValue(client);

    await sign(form());

    expect(
      writes.some((w) => w.table === "enrollment_packet_signatures" && w.op === "insert")
    ).toBe(true);
  });
});

describe("a partly signed packet stays partly signed", () => {
  it("does not complete while a required document is unsigned", async () => {
    const { client, writes } = makeClient({
      enrollment_packets: { data: PACKET },
      enrollment_packet_templates: {
        data: [
          { template_key: "enrollment_agreement", requires_signature: true },
          { template_key: "tuition_agreement", requires_signature: true },
        ],
        error: null,
      },
      enrollment_packet_signatures: {
        data: [{ template_key: "enrollment_agreement" }],
        error: null,
      },
    });
    createAuthClient.mockResolvedValue(client);

    const result = await sign(form());

    expect(result).toMatchObject({ success: true, completed: false });
    expect(completedPacket(writes)).toBe(false);
    expect(completeEnrollmentHandoff).not.toHaveBeenCalled();
    expect(
      writes.some(
        (w) => w.table === "enrollment_packets" && w.payload.packet_status === "partially_signed"
      )
    ).toBe(true);
  });
});

describe("a fully signed packet enrolls the student", () => {
  const fullySigned = {
    enrollment_packets: { data: PACKET },
    enrollment_packet_templates: {
      data: [
        { template_key: "enrollment_agreement", requires_signature: true },
        { template_key: "tuition_agreement", requires_signature: true },
      ],
      error: null,
    },
    enrollment_packet_signatures: {
      data: [{ template_key: "enrollment_agreement" }, { template_key: "tuition_agreement" }],
      error: null,
    },
  };

  it("completes and hands off", async () => {
    const { client, writes } = makeClient(fullySigned);
    createAuthClient.mockResolvedValue(client);

    const result = await sign(form());

    expect(result).toMatchObject({ success: true, completed: true });
    expect(completedPacket(writes)).toBe(true);
    expect(completeEnrollmentHandoff).toHaveBeenCalledTimes(1);
  });

  it("reports when the student was enrolled but nothing was billed", async () => {
    // Migration 248 archived the $12,000 placeholder plans, so this is now the
    // ordinary case until a school has a real price. An enrolled student with no
    // invoice must be visible, not inferred later from an empty billing account.
    completeEnrollmentHandoff.mockResolvedValue({
      success: true,
      studentId: "stu-1",
      tuitionPlanMissing: true,
    });
    const { client } = makeClient(fullySigned);
    createAuthClient.mockResolvedValue(client);

    const result = await sign(form());

    expect(result).toMatchObject({ completed: true, tuitionPlanMissing: true });
  });

  it("reports no missing plan when the family was actually invoiced", async () => {
    completeEnrollmentHandoff.mockResolvedValue({
      success: true,
      studentId: "stu-1",
      tuitionPlanMissing: false,
    });
    const { client } = makeClient(fullySigned);
    createAuthClient.mockResolvedValue(client);

    const result = await sign(form());

    expect(result).toMatchObject({ completed: true, tuitionPlanMissing: false });
  });

  it("surfaces a handoff failure instead of reporting a clean enrollment", async () => {
    completeEnrollmentHandoff.mockResolvedValue({
      success: false,
      error: "SIS conversion failed",
    });
    const { client } = makeClient(fullySigned);
    createAuthClient.mockResolvedValue(client);

    const result = await sign(form());

    expect(result).toMatchObject({ success: false, handoffError: "SIS conversion failed" });
  });
});

describe("the property that broke", () => {
  it("every() on an empty set is true — which is why the guard exists", () => {
    // Kept as a plain assertion because the bug was not in the query or the
    // schema. It was in believing this line meant "everything is signed".
    const requiredKeys = new Set<string>();
    const signedKeys = new Set<string>();
    expect([...requiredKeys].every((k) => signedKeys.has(k))).toBe(true);
  });
});

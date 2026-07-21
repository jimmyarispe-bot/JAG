import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../helpers/mock-supabase";
import type { IdentityContext } from "@/lib/platform/identity/context";

vi.mock("@/lib/platform/shared/context", () => ({
  resolveActorUserId: vi.fn(async () => TEST_UUIDS.user),
  resolveSchoolContext: vi.fn(async () => ({
    organizationId: TEST_UUIDS.organization,
    schoolId: TEST_UUIDS.school,
  })),
}));

vi.mock("@/lib/platform/activity", () => ({
  recordActivity: vi.fn(async () => ({ id: TEST_UUIDS.activity })),
}));

import { recordActivity } from "@/lib/platform/activity";
import {
  canComposeCommunications,
  canManageCommunications,
  canViewCommunications,
} from "@/lib/communications/access";
import { createAnnouncement } from "@/lib/communications/announcements";
import { createInAppNotification } from "@/lib/communications/notifications";
import { logMeeting } from "@/lib/communications/meetings";
import { logPhoneCall } from "@/lib/communications/phone-calls";
import {
  composeAndSend,
  saveDraft,
  scheduleCommunication,
  sendCommunication,
} from "@/lib/communications/service";
import { renderTemplate, renderTemplateString } from "@/lib/communications/templates";

const COMM_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const AUDIT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const FAMILY_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function identityWithRoles(roles: string[]): IdentityContext {
  return {
    id: TEST_UUIDS.user,
    email: "test@example.com",
    fullName: "Test User",
    roles: roles as IdentityContext["roles"],
    primaryRole: roles[0] as IdentityContext["primaryRole"],
    roleLabel: roles[0] ?? "User",
    effectiveUserId: TEST_UUIDS.user,
    permissions: ["students.edit", "students.view"],
    orgAssignments: [],
    accessibleSchoolIds: [TEST_UUIDS.school],
    hasUnrestrictedSchoolAccess: roles.includes("CEO") || roles.includes("FOUNDER"),
    isFounder: roles.includes("FOUNDER"),
    isEnterpriseAdmin: false,
    impersonation: null,
    preferences: null,
  };
}

describe("Communications permissions", () => {
  it("CEO has full manage access", () => {
    expect(canManageCommunications(identityWithRoles(["CEO"]))).toBe(true);
    expect(canComposeCommunications(identityWithRoles(["CEO"]))).toBe(true);
  });

  it("Admissions can compose but Teachers can compose for their scope", () => {
    expect(canComposeCommunications(identityWithRoles(["ADMISSIONS"]))).toBe(true);
    expect(canComposeCommunications(identityWithRoles(["TEACHER"]))).toBe(true);
    expect(canManageCommunications(identityWithRoles(["ADMISSIONS"]))).toBe(false);
  });

  it("Parents can view but not manage", () => {
    expect(canViewCommunications(identityWithRoles(["PARENT"]))).toBe(true);
    expect(canManageCommunications(identityWithRoles(["PARENT"]))).toBe(false);
  });
});

describe("Template rendering", () => {
  it("replaces merge variables", () => {
    const rendered = renderTemplateString(
      "Hello {{GuardianName}}, {{StudentName}} at {{School}}",
      {
        GuardianName: "Jordan",
        StudentName: "Ava",
        School: "Academy",
      }
    );
    expect(rendered).toBe("Hello Jordan, Ava at Academy");
  });

  it("renders subject and body from template", () => {
    const preview = renderTemplate(
      {
        subject: "Welcome {{StudentName}}",
        body_text: "Dear {{GuardianName}}",
        body_html: "<p>{{School}}</p>",
      },
      { StudentName: "Ava", GuardianName: "Jordan", School: "Academy" }
    );
    expect(preview.subject).toBe("Welcome Ava");
    expect(preview.bodyText).toBe("Dear Jordan");
    expect(preview.bodyHtml).toBe("<p>Academy</p>");
  });
});

describe("Compose / draft / send / schedule", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves a draft communication", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "users" && operation === "maybeSingle") {
        return { data: { full_name: "Staff User" }, error: null };
      }
      if (table === "platform_communications" && operation === "single") {
        return {
          data: { id: COMM_ID, audit_id: AUDIT_ID, status: "draft" },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await saveDraft(supabase, {
      type: "email",
      subject: "Hello",
      bodyText: "Body",
      schoolId: TEST_UUIDS.school,
      familyId: FAMILY_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe("draft");
      expect(result.auditId).toBe(AUDIT_ID);
    }
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "communication.created" })
    );
  });

  it("schedules a message", async () => {
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "users" && operation === "maybeSingle") {
        return { data: { full_name: "Staff User" }, error: null };
      }
      if (table === "platform_communications" && operation === "single") {
        expect((payload as { status?: string }).status).toBe("scheduled");
        return {
          data: { id: COMM_ID, audit_id: AUDIT_ID, status: "scheduled" },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await scheduleCommunication(supabase, {
      type: "email",
      subject: "Tomorrow",
      bodyText: "Reminder",
      schoolId: TEST_UUIDS.school,
      scheduledFor: "2026-07-22T09:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe("scheduled");
  });

  it("sends a queued communication and emits communication.sent", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_communications" && operation === "maybeSingle") {
        return {
          data: {
            id: COMM_ID,
            audit_id: AUDIT_ID,
            type: "email",
            status: "queued",
            subject: "Hello",
            body_text: "Body",
            body_html: null,
            organization_id: TEST_UUIDS.organization,
            school_id: TEST_UUIDS.school,
            student_id: null,
            family_id: FAMILY_ID,
          },
          error: null,
        };
      }
      if (table === "platform_communication_recipients" && operation === "select") {
        return {
          data: [{ email: "parent@example.com", phone: null, recipient_id: null, display_name: "Parent" }],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await sendCommunication(supabase, COMM_ID);
    expect(result.ok).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "communication.sent" })
    );
  });

  it("composeAndSend creates then sends", async () => {
    let created = false;
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "users" && operation === "maybeSingle") {
        return { data: { full_name: "Staff" }, error: null };
      }
      if (table === "platform_communications" && operation === "single") {
        created = true;
        return {
          data: { id: COMM_ID, audit_id: AUDIT_ID, status: "queued" },
          error: null,
        };
      }
      if (table === "platform_communications" && operation === "maybeSingle") {
        return {
          data: {
            id: COMM_ID,
            audit_id: AUDIT_ID,
            type: "portal",
            status: "queued",
            subject: "Portal note",
            body_text: "Hi",
            body_html: null,
            organization_id: TEST_UUIDS.organization,
            school_id: TEST_UUIDS.school,
            student_id: TEST_UUIDS.student,
            family_id: FAMILY_ID,
          },
          error: null,
        };
      }
      if (table === "platform_communication_recipients") {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    });

    const result = await composeAndSend(supabase, {
      type: "portal",
      subject: "Portal note",
      bodyText: "Hi",
      schoolId: TEST_UUIDS.school,
      studentId: TEST_UUIDS.student,
      familyId: FAMILY_ID,
    });

    expect(created).toBe(true);
    expect(result.ok).toBe(true);
  });
});

describe("Announcements / phone / meeting / notifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("publishes an announcement and emits announcement.published", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_announcements" && operation === "single") {
        return { data: { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" }, error: null };
      }
      if (table === "users" && operation === "maybeSingle") {
        return { data: { full_name: "Staff" }, error: null };
      }
      if (table === "platform_communications" && operation === "single") {
        return {
          data: { id: COMM_ID, audit_id: AUDIT_ID, status: "queued" },
          error: null,
        };
      }
      if (table === "platform_communications" && operation === "maybeSingle") {
        return {
          data: {
            id: COMM_ID,
            audit_id: AUDIT_ID,
            type: "announcement",
            status: "queued",
            subject: "School update",
            body_text: "Details",
            body_html: null,
            organization_id: TEST_UUIDS.organization,
            school_id: TEST_UUIDS.school,
            student_id: null,
            family_id: null,
          },
          error: null,
        };
      }
      if (table === "platform_communication_recipients") {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    });

    const result = await createAnnouncement(supabase, {
      title: "School update",
      bodyText: "Details",
      schoolId: TEST_UUIDS.school,
      targetAudience: "parents",
      publishNow: true,
    });

    expect(result.ok).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "announcement.published" })
    );
  });

  it("logs a phone call", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "users" && operation === "maybeSingle") {
        return { data: { full_name: "Staff" }, error: null };
      }
      if (table === "platform_communications" && operation === "single") {
        return {
          data: { id: COMM_ID, audit_id: AUDIT_ID, status: "draft" },
          error: null,
        };
      }
      if (table === "platform_phone_call_logs" && operation === "single") {
        return { data: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }, error: null };
      }
      return { data: null, error: null };
    });

    const result = await logPhoneCall(supabase, {
      direction: "outbound",
      schoolId: TEST_UUIDS.school,
      familyId: FAMILY_ID,
      durationSeconds: 120,
      notes: "Discussed enrollment",
      followUpRequired: true,
      outcome: "callback scheduled",
    });

    expect(result.ok).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "phonecall.logged" })
    );
  });

  it("logs a meeting", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "users" && operation === "maybeSingle") {
        return { data: { full_name: "Staff" }, error: null };
      }
      if (table === "platform_communications" && operation === "single") {
        return {
          data: { id: COMM_ID, audit_id: AUDIT_ID, status: "draft" },
          error: null,
        };
      }
      if (table === "platform_meeting_logs" && operation === "single") {
        return { data: { id: "ffffffff-ffff-4fff-8fff-ffffffffffff" }, error: null };
      }
      return { data: null, error: null };
    });

    const result = await logMeeting(supabase, {
      title: "Parent conference",
      meetingType: "parent_conference",
      schoolId: TEST_UUIDS.school,
      studentId: TEST_UUIDS.student,
      familyId: FAMILY_ID,
      participants: [{ name: "Jordan Guardian" }],
      notes: "Progress discussed",
      decisions: "Continue interventions",
      actionItems: [{ text: "Send progress report" }],
    });

    expect(result.ok).toBe(true);
    expect(recordActivity).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ eventType: "meeting.logged" })
    );
  });

  it("creates an in-app notification", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_in_app_notifications" && operation === "single") {
        return { data: { id: "11111111-1111-4111-8111-111111111111" }, error: null };
      }
      return { data: null, error: null };
    });

    const result = await createInAppNotification(supabase, {
      userId: TEST_UUIDS.user,
      title: "Parent replied",
      body: "New portal message",
      category: "message",
      href: "/dashboard/communications",
    });

    expect(result.ok).toBe(true);
  });
});

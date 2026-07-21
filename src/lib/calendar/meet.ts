import {
  getExtension,
  invokeExtension,
  registerExtension,
  type AcademyExtensionAdapter,
} from "@/lib/workflows/extension";

export interface MeetCreateInput {
  title: string;
  startsAt: string;
  endsAt: string;
  timezone?: string;
  organizationId?: string | null;
  schoolId?: string | null;
}

export interface MeetLinkResult {
  ok: boolean;
  deferred: boolean;
  joinUrl: string | null;
  externalId: string | null;
  provider: string;
  message: string;
}

const GOOGLE_MEET_EXTENSION_ID = "google_meet";

const googleMeetAdapter: AcademyExtensionAdapter = {
  manifest: {
    id: GOOGLE_MEET_EXTENSION_ID,
    name: "Google Meet",
    version: "0.0.0",
    capabilities: ["calendar"],
    description: "Google Meet create/update/cancel — deferred until integration sprint",
  },
  isConfigured: () => false,
  async invoke(input) {
    return {
      ok: true,
      deferred: true,
      message: `Google Meet ${input.operation} deferred — adapter not configured`,
      data: {
        joinUrl: null,
        externalId: null,
      },
    };
  },
};

/** Register Meet adapter once (idempotent). */
export function ensureGoogleMeetExtensionRegistered(): void {
  if (!getExtension(GOOGLE_MEET_EXTENSION_ID)) {
    registerExtension(googleMeetAdapter);
  }
}

ensureGoogleMeetExtensionRegistered();

export async function createMeetLink(input: MeetCreateInput): Promise<MeetLinkResult> {
  ensureGoogleMeetExtensionRegistered();
  const result = await invokeExtension(GOOGLE_MEET_EXTENSION_ID, {
    capability: "calendar",
    operation: "create_meeting",
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    payload: {
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      timezone: input.timezone,
    },
  });

  return {
    ok: result.ok,
    deferred: result.deferred,
    joinUrl: (result.data?.joinUrl as string | null) ?? null,
    externalId: (result.data?.externalId as string | null) ?? null,
    provider: GOOGLE_MEET_EXTENSION_ID,
    message: result.message,
  };
}

export async function updateMeetLink(input: {
  externalId: string;
  title?: string;
  startsAt?: string;
  endsAt?: string;
  organizationId?: string | null;
  schoolId?: string | null;
}): Promise<MeetLinkResult> {
  ensureGoogleMeetExtensionRegistered();
  const result = await invokeExtension(GOOGLE_MEET_EXTENSION_ID, {
    capability: "calendar",
    operation: "update_meeting",
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    payload: input,
  });
  return {
    ok: result.ok,
    deferred: result.deferred,
    joinUrl: (result.data?.joinUrl as string | null) ?? null,
    externalId: input.externalId,
    provider: GOOGLE_MEET_EXTENSION_ID,
    message: result.message,
  };
}

export async function cancelMeetLink(input: {
  externalId: string;
  organizationId?: string | null;
  schoolId?: string | null;
}): Promise<MeetLinkResult> {
  ensureGoogleMeetExtensionRegistered();
  const result = await invokeExtension(GOOGLE_MEET_EXTENSION_ID, {
    capability: "calendar",
    operation: "cancel_meeting",
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    payload: { externalId: input.externalId },
  });
  return {
    ok: result.ok,
    deferred: result.deferred,
    joinUrl: null,
    externalId: input.externalId,
    provider: GOOGLE_MEET_EXTENSION_ID,
    message: result.message,
  };
}

/**
 * Live Google Classroom read, for the proof page.
 *
 * Deliberately does not touch the education store, the knowledge graph or any
 * table: it calls Google and returns what came back. The point of this slice is
 * to prove the connection works against real data before anything maps Classroom
 * onto JAG's own student records — the mistake worth not repeating is building a
 * destination for data nobody has confirmed is arriving.
 */

import { createAuthClient } from "@/lib/supabase/server-auth";
import { encryptCredentialSecret } from "@/lib/integration-hub/vault-crypto";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import { ensureGoogleWorkspaceAccessToken } from "@/lib/platform/integrations/google-workspace/sync/token-bridge";
import { googleWorkspaceCredentials } from "@/lib/platform/integrations/connectors/google-workspace/services/client-factory";
import { createGoogleClassroomClient } from "@/lib/platform/integrations/connectors/education/services/google-classroom-client";

export type ClassroomCourseSummary = {
  id: string;
  name: string;
  section: string;
  state: string;
  teachers: string[];
  studentCount: number;
  students: { name: string; email: string }[];
};

export type ClassroomLiveResult =
  | { ok: true; courses: ClassroomCourseSummary[]; fetchedAt: string }
  | { ok: false; reason: "not_configured" | "not_connected" | "scope" | "error"; message: string };

/** Roster detail is capped so the proof page cannot become a slow full export. */
const MAX_COURSES = 25;

export async function readClassroomLive(): Promise<ClassroomLiveResult> {
  if (!googleWorkspaceCredentials().configured) {
    return {
      ok: false,
      reason: "not_configured",
      message:
        "GOOGLE_WORKSPACE_CLIENT_ID and GOOGLE_WORKSPACE_CLIENT_SECRET are not set in this environment, so there is nothing to call Google with.",
    };
  }

  const supabase = await createAuthClient();
  const organizationId = await getPrimaryOrganizationId(supabase);
  if (!organizationId) {
    return { ok: false, reason: "error", message: "No organization resolved for this account." };
  }

  const tokens = await ensureGoogleWorkspaceAccessToken(supabase, organizationId);
  if ("error" in tokens) {
    return { ok: false, reason: "not_connected", message: tokens.error };
  }

  const client = createGoogleClassroomClient({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    onTokenRefreshed: async (next) => {
      await supabase
        .from("integration_connections")
        .update({
          access_token: encryptCredentialSecret(next.accessToken),
          expires_at: next.expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tokens.connection.id);
    },
  });

  try {
    const courses: ClassroomCourseSummary[] = [];
    let cursor: string | null = null;

    do {
      const page = await client.list(organizationId, "course", null, cursor);
      for (const record of page.records) {
        courses.push({
          id: record.id,
          name: String(record.payload.name ?? record.id),
          section: String(record.payload.section ?? ""),
          state: String(record.payload.state ?? ""),
          teachers: [],
          studentCount: 0,
          students: [],
        });
      }
      cursor = page.nextCursor;
    } while (cursor && courses.length < MAX_COURSES);

    // Rosters are per course. Walk the roster cursor and bucket by courseId rather
    // than issuing a call per course from here — the client already knows how to
    // page across courses.
    const byCourse = new Map(courses.map((c) => [c.id, c]));
    for (const kind of ["teacher", "student"] as const) {
      let rosterCursor: string | null = null;
      let guard = 0;
      do {
        const page = await client.list(organizationId, kind, null, rosterCursor);
        for (const record of page.records) {
          const courseId = String(record.payload.courseId ?? "");
          const course = byCourse.get(courseId);
          if (!course) continue;
          const name = String(record.payload.name ?? "");
          const email = String(record.payload.email ?? "");
          if (kind === "teacher") course.teachers.push(name || email);
          else {
            course.studentCount += 1;
            if (course.students.length < 50) course.students.push({ name, email });
          }
        }
        rosterCursor = page.nextCursor;
        guard += 1;
        // Hard stop: a malformed cursor must not spin forever against Google.
      } while (rosterCursor && guard < 500);
    }

    return { ok: true, courses, fetchedAt: new Date().toISOString() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // A 403 here is a consent problem, not a bug, and the fix is a reconnect.
    if (/403|insufficient|scope|PERMISSION_DENIED/i.test(message)) {
      return {
        ok: false,
        reason: "scope",
        message:
          "Google accepted the token but refused Classroom. The Classroom scopes were added after this connection was authorized — disconnect and reconnect Google Workspace to grant them. Original error: " +
          message,
      };
    }
    return { ok: false, reason: "error", message };
  }
}

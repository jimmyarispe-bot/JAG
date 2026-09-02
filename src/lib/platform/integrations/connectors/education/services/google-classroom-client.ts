/**
 * Google Classroom — the real client.
 *
 * The education connectors (Canvas, PowerSchool, Classroom) all ran on
 * `createDemoEducationClient`, which serves rows from a hardcoded catalogue and
 * whose `authenticate()` returns ok for any non-empty string. Classroom was the
 * one the schools actually use, so this is the one that gets a real
 * implementation first.
 *
 * It reuses the Google Workspace OAuth connection rather than introducing a
 * second Google login: same Google account, same encrypted refresh token, one
 * consent screen. The Classroom scopes are added to that connection's scope list,
 * which does mean an existing connection must re-consent once to pick them up.
 *
 * Read-only throughout. Classroom's write endpoints are not reachable from here.
 */

import type {
  EducationClient,
  EducationListPage,
} from "@/lib/platform/integrations/connectors/education/services/client";
import type {
  EducationObjectType,
  EducationRawEntity,
} from "@/lib/platform/integrations/connectors/education/entities";

const CLASSROOM = "https://classroom.googleapis.com/v1";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PAGE_SIZE = 50;

export const GOOGLE_CLASSROOM_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
  "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
  "https://www.googleapis.com/auth/classroom.profile.emails",
] as const;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type GoogleClassroomClientOptions = {
  accessToken: string;
  refreshToken?: string | null;
  clientId?: string;
  clientSecret?: string;
  onTokenRefreshed?: (tokens: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: string;
  }) => Promise<void> | void;
  fetchImpl?: FetchLike;
};

class ClassroomApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ClassroomApiError";
  }
}

type CourseRef = { id: string; name: string };

function qs(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

function iso(value: unknown, fallback: string): string {
  if (typeof value === "string" && value) {
    const t = Date.parse(value);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }
  return fallback;
}

export function createGoogleClassroomClient(
  options: GoogleClassroomClientOptions
): EducationClient {
  const doFetch: FetchLike = options.fetchImpl ?? ((url, init) => fetch(url, init));
  let accessToken = options.accessToken;
  let refreshToken = options.refreshToken ?? null;
  const clientId =
    options.clientId ?? process.env.GOOGLE_WORKSPACE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret =
    options.clientSecret ??
    process.env.GOOGLE_WORKSPACE_CLIENT_SECRET ??
    process.env.GOOGLE_CLIENT_SECRET ??
    "";

  /** Courses are needed by almost every other object type; fetch them once. */
  let courseCache: CourseRef[] | null = null;

  async function refresh(): Promise<boolean> {
    if (!refreshToken || !clientId || !clientSecret) return false;
    const response = await doFetch(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });
    if (!response.ok) return false;
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const next = typeof body.access_token === "string" ? body.access_token : "";
    if (!next) return false;
    accessToken = next;
    if (typeof body.refresh_token === "string") refreshToken = body.refresh_token;
    if (options.onTokenRefreshed) {
      await options.onTokenRefreshed({
        accessToken: next,
        refreshToken,
        expiresAt: new Date(
          Date.now() + (typeof body.expires_in === "number" ? body.expires_in : 3600) * 1000
        ).toISOString(),
      });
    }
    return true;
  }

  async function get<T>(path: string, allowRetry = true): Promise<T> {
    const response = await doFetch(`${CLASSROOM}${path}`, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
    });

    if (response.status === 401 && allowRetry) {
      const ok = await refresh();
      if (!ok) {
        throw new ClassroomApiError(
          "Google rejected the Classroom access token and it could not be refreshed. Reconnect Google Workspace.",
          401
        );
      }
      return get<T>(path, false);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let detail = text.slice(0, 300);
      try {
        const parsed = JSON.parse(text) as { error?: { message?: string } };
        if (parsed.error?.message) detail = parsed.error.message;
      } catch {
        /* raw text is the best available detail */
      }
      // 403 here almost always means the Classroom scopes were never consented,
      // which is a re-connect, not a retry.
      throw new ClassroomApiError(`Classroom API ${response.status}: ${detail}`, response.status);
    }

    return (await response.json()) as T;
  }

  async function allCourses(): Promise<CourseRef[]> {
    if (courseCache) return courseCache;
    const out: CourseRef[] = [];
    let pageToken: string | null = null;
    do {
      const page: { courses?: { id: string; name?: string }[]; nextPageToken?: string } = await get(
        `/courses${qs({ pageSize: 100, pageToken, courseStates: "ACTIVE" })}`
      );
      for (const c of page.courses ?? []) out.push({ id: c.id, name: c.name ?? c.id });
      pageToken = page.nextPageToken ?? null;
    } while (pageToken);
    courseCache = out;
    return out;
  }

  function entity(
    objectType: EducationObjectType,
    id: string,
    organizationId: string,
    updatedAt: string,
    payload: Record<string, unknown>
  ): EducationRawEntity {
    return {
      id,
      objectType,
      provider: "google_classroom",
      organizationId,
      updatedAt,
      version: 1,
      payload: { ...payload, name: payload.name ?? payload.title ?? id },
    };
  }

  /**
   * Roster and coursework endpoints are all per-course, so a position in the walk
   * is (which course, where in that course). The cursor encodes both; it is opaque
   * to callers, which only ever hand it back.
   */
  function parseCourseCursor(cursor: string | null, courseCount: number): { index: number; token: string | null } {
    const [rawIndex, rawToken] = (cursor ?? "0|").split("|");
    let index = Number(rawIndex);
    if (!Number.isInteger(index) || index < 0 || index >= courseCount) index = 0;
    return { index, token: rawToken || null };
  }

  function nextCourseCursor(index: number, token: string | undefined, courseCount: number): string | null {
    if (token) return `${index}|${token}`;
    return index + 1 < courseCount ? `${index + 1}|` : null;
  }

  async function courses(organizationId: string, cursor: string | null): Promise<EducationListPage> {
    const page: {
      courses?: {
        id: string;
        name?: string;
        section?: string;
        room?: string;
        courseState?: string;
        updateTime?: string;
        ownerId?: string;
        enrollmentCode?: string;
      }[];
      nextPageToken?: string;
    } = await get(`/courses${qs({ pageSize: PAGE_SIZE, pageToken: cursor, courseStates: "ACTIVE" })}`);

    const now = new Date().toISOString();
    return {
      records: (page.courses ?? []).map((c) =>
        entity("course", c.id, organizationId, iso(c.updateTime, now), {
          name: c.name ?? c.id,
          section: c.section ?? "",
          room: c.room ?? "",
          state: c.courseState ?? "ACTIVE",
          ownerId: c.ownerId ?? "",
          enrollmentCode: c.enrollmentCode ?? "",
        })
      ),
      nextCursor: page.nextPageToken ?? null,
    };
  }

  async function roster(
    organizationId: string,
    objectType: "student" | "teacher",
    cursor: string | null
  ): Promise<EducationListPage> {
    const list = await allCourses();
    if (list.length === 0) return { records: [], nextCursor: null };

    const { index, token } = parseCourseCursor(cursor, list.length);
    const course = list[index];
    const segment = objectType === "student" ? "students" : "teachers";

    const page: {
      students?: { userId: string; profile?: { name?: { fullName?: string }; emailAddress?: string } }[];
      teachers?: { userId: string; profile?: { name?: { fullName?: string }; emailAddress?: string } }[];
      nextPageToken?: string;
    } = await get(`/courses/${encodeURIComponent(course.id)}/${segment}${qs({ pageSize: PAGE_SIZE, pageToken: token })}`);

    const people = (objectType === "student" ? page.students : page.teachers) ?? [];
    const now = new Date().toISOString();

    return {
      // Composite id, because the same person appears in every course they are in.
      // Keying on userId alone would let the last course seen overwrite the rest
      // and quietly erase a student's other classes.
      records: people.map((p) =>
        entity(objectType, `${course.id}::${p.userId}`, organizationId, now, {
          name: p.profile?.name?.fullName ?? p.userId,
          email: p.profile?.emailAddress ?? "",
          userId: p.userId,
          courseId: course.id,
          courseName: course.name,
        })
      ),
      nextCursor: nextCourseCursor(index, page.nextPageToken, list.length),
    };
  }

  async function assignments(organizationId: string, cursor: string | null): Promise<EducationListPage> {
    const list = await allCourses();
    if (list.length === 0) return { records: [], nextCursor: null };

    const { index, token } = parseCourseCursor(cursor, list.length);
    const course = list[index];

    const page: {
      courseWork?: {
        id: string;
        title?: string;
        description?: string;
        state?: string;
        maxPoints?: number;
        dueDate?: { year?: number; month?: number; day?: number };
        updateTime?: string;
        workType?: string;
      }[];
      nextPageToken?: string;
    } = await get(
      `/courses/${encodeURIComponent(course.id)}/courseWork${qs({ pageSize: PAGE_SIZE, pageToken: token })}`
    );

    const now = new Date().toISOString();
    return {
      records: (page.courseWork ?? []).map((w) =>
        entity("assignment", `${course.id}::${w.id}`, organizationId, iso(w.updateTime, now), {
          title: w.title ?? w.id,
          description: w.description ?? "",
          state: w.state ?? "PUBLISHED",
          maxPoints: w.maxPoints ?? 0,
          workType: w.workType ?? "ASSIGNMENT",
          dueDate: w.dueDate
            ? `${w.dueDate.year}-${String(w.dueDate.month).padStart(2, "0")}-${String(w.dueDate.day).padStart(2, "0")}`
            : "",
          courseId: course.id,
          courseName: course.name,
          courseWorkId: w.id,
        })
      ),
      nextCursor: nextCourseCursor(index, page.nextPageToken, list.length),
    };
  }

  /**
   * Grades are submissions, which live three levels down: course → coursework →
   * submission. The cursor carries all three positions.
   */
  async function grades(organizationId: string, cursor: string | null): Promise<EducationListPage> {
    const list = await allCourses();
    if (list.length === 0) return { records: [], nextCursor: null };

    const [rawCourse, rawWork, rawToken] = (cursor ?? "0|0|").split("|");
    let courseIndex = Number(rawCourse);
    if (!Number.isInteger(courseIndex) || courseIndex < 0 || courseIndex >= list.length) courseIndex = 0;
    let workIndex = Number(rawWork);
    if (!Number.isInteger(workIndex) || workIndex < 0) workIndex = 0;
    const token = rawToken || null;

    const course = list[courseIndex];
    const work: { courseWork?: { id: string; title?: string; maxPoints?: number }[] } = await get(
      `/courses/${encodeURIComponent(course.id)}/courseWork${qs({ pageSize: 100 })}`
    );
    const allWork = work.courseWork ?? [];

    if (allWork.length === 0) {
      const next = courseIndex + 1 < list.length ? `${courseIndex + 1}|0|` : null;
      return { records: [], nextCursor: next };
    }
    if (workIndex >= allWork.length) workIndex = 0;
    const current = allWork[workIndex];

    const page: {
      studentSubmissions?: {
        id: string;
        userId?: string;
        state?: string;
        late?: boolean;
        assignedGrade?: number;
        draftGrade?: number;
        updateTime?: string;
      }[];
      nextPageToken?: string;
    } = await get(
      `/courses/${encodeURIComponent(course.id)}/courseWork/${encodeURIComponent(current.id)}/studentSubmissions${qs({
        pageSize: PAGE_SIZE,
        pageToken: token,
      })}`
    );

    const now = new Date().toISOString();
    const records = (page.studentSubmissions ?? []).map((s) =>
      entity("grade", s.id, organizationId, iso(s.updateTime, now), {
        name: `${current.title ?? current.id} — ${s.userId ?? "unknown"}`,
        userId: s.userId ?? "",
        courseId: course.id,
        courseName: course.name,
        courseWorkId: current.id,
        assignmentTitle: current.title ?? current.id,
        state: s.state ?? "NEW",
        late: Boolean(s.late),
        assignedGrade: s.assignedGrade ?? null,
        draftGrade: s.draftGrade ?? null,
        maxPoints: current.maxPoints ?? 0,
      })
    );

    let nextCursor: string | null;
    if (page.nextPageToken) nextCursor = `${courseIndex}|${workIndex}|${page.nextPageToken}`;
    else if (workIndex + 1 < allWork.length) nextCursor = `${courseIndex}|${workIndex + 1}|`;
    else if (courseIndex + 1 < list.length) nextCursor = `${courseIndex + 1}|0|`;
    else nextCursor = null;

    return { records, nextCursor };
  }

  return {
    provider: "google_classroom",

    async authenticate(input) {
      if (input.accessToken) accessToken = input.accessToken;
      try {
        // Cheapest call that proves both the token and the Classroom scopes.
        await get<unknown>(`/courses${qs({ pageSize: 1 })}`);
        return { ok: true, accessToken };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    },

    async refreshToken(token) {
      refreshToken = token || refreshToken;
      const ok = await refresh();
      if (!ok) return { ok: false, error: "Google refused the refresh token." };
      return {
        ok: true,
        accessToken,
        refreshToken: refreshToken ?? undefined,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
    },

    async health() {
      const started = Date.now();
      try {
        await get<unknown>(`/courses${qs({ pageSize: 1 })}`);
        return { ok: true, latencyMs: Date.now() - started };
      } catch {
        return { ok: false, latencyMs: Date.now() - started };
      }
    },

    objectTypes() {
      // attendance and schedule are absent on purpose — see list().
      return ["course", "student", "teacher", "assignment", "grade"];
    },

    async list(organizationId, objectType, _since, cursor) {
      switch (objectType) {
        case "course":
          return courses(organizationId, cursor ?? null);
        case "class":
          // "class" is a legacy alias normalized as Course. Emitting it as well
          // would duplicate every course in the knowledge graph.
          return { records: [], nextCursor: null };
        case "student":
        case "teacher":
          return roster(organizationId, objectType, cursor ?? null);
        case "assignment":
          return assignments(organizationId, cursor ?? null);
        case "grade":
          return grades(organizationId, cursor ?? null);
        case "attendance":
        case "schedule":
          // Google Classroom has no attendance API and exposes no timetable —
          // courses carry no meeting times. Returning empty is the honest answer;
          // inventing rows here is how a fixture starts.
          return { records: [], nextCursor: null };
        default: {
          const never: never = objectType;
          throw new Error(`Unhandled education object type: ${String(never)}`);
        }
      }
    },
  };
}

/**
 * Tests for the real Google Classroom client.
 *
 * Same rule as the Workspace client: assert on the URLs that actually leave the
 * process. The connector these replace returned confident-looking rosters having
 * called nothing, so "records came back" proves nothing on its own.
 */

import { describe, expect, it, vi } from "vitest";
import { createGoogleClassroomClient } from "@/lib/platform/integrations/connectors/education/services/google-classroom-client";

const ORG = "org-test";

type Route = { match: RegExp; body: unknown; status?: number };

function harness(routes: Route[]) {
  const calls: string[] = [];
  const impl = vi.fn(async (url: string) => {
    calls.push(url);
    const route = routes.find((r) => r.match.test(url));
    const status = route?.status ?? (route ? 200 : 404);
    const payload = route?.body ?? { error: { message: `no stub for ${url}` } };
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    } as unknown as Response;
  });

  const client = createGoogleClassroomClient({
    accessToken: "access-1",
    refreshToken: "refresh-1",
    clientId: "cid",
    clientSecret: "csecret",
    fetchImpl: impl as never,
  });

  return { client, calls };
}

const TWO_COURSES: Route = {
  match: /\/v1\/courses\?/,
  body: {
    courses: [
      { id: "c1", name: "Algebra II", section: "Period 3", updateTime: "2026-08-20T10:00:00Z" },
      { id: "c2", name: "US History", section: "Period 5", updateTime: "2026-08-21T10:00:00Z" },
    ],
  },
};

describe("google classroom client", () => {
  it("lists real courses from the Classroom API", async () => {
    const { client, calls } = harness([TWO_COURSES]);
    const page = await client.list(ORG, "course", null, null);

    expect(calls[0]).toContain("https://classroom.googleapis.com/v1/courses");
    expect(calls[0]).toContain("courseStates=ACTIVE");
    expect(page.records).toHaveLength(2);
    expect(page.records[0].provider).toBe("google_classroom");
    expect(page.records[0].payload.name).toBe("Algebra II");
    expect(page.records[0].payload.section).toBe("Period 3");
  });

  it("gives each student a per-course id so a second course cannot overwrite the first", async () => {
    const { client } = harness([
      TWO_COURSES,
      {
        match: /courses\/c1\/students/,
        body: {
          students: [
            { userId: "u1", profile: { name: { fullName: "Konnor Broyld" }, emailAddress: "k@example.com" } },
          ],
        },
      },
      {
        match: /courses\/c2\/students/,
        body: {
          students: [
            { userId: "u1", profile: { name: { fullName: "Konnor Broyld" }, emailAddress: "k@example.com" } },
          ],
        },
      },
    ]);

    const first = await client.list(ORG, "student", null, null);
    const second = await client.list(ORG, "student", null, first.nextCursor);

    expect(first.records[0].id).toBe("c1::u1");
    expect(second.records[0].id).toBe("c2::u1");
    // Same human, two enrollments, two distinct records — keying on userId alone
    // would have silently erased one of this student's classes.
    expect(first.records[0].payload.userId).toBe("u1");
    expect(second.records[0].payload.courseName).toBe("US History");
    expect(second.nextCursor).toBeNull();
  });

  it("walks courses in order and stops when the last one is done", async () => {
    const { client } = harness([
      TWO_COURSES,
      { match: /courses\/c1\/teachers/, body: { teachers: [{ userId: "t1", profile: { name: { fullName: "Nina Gaddy" } } }] } },
      { match: /courses\/c2\/teachers/, body: { teachers: [] } },
    ]);

    const first = await client.list(ORG, "teacher", null, null);
    expect(first.records[0].payload.name).toBe("Nina Gaddy");
    expect(first.nextCursor).toBe("1|");

    const second = await client.list(ORG, "teacher", null, first.nextCursor);
    expect(second.records).toHaveLength(0);
    expect(second.nextCursor).toBeNull();
  });

  it("reads coursework as assignments with due dates", async () => {
    const { client, calls } = harness([
      TWO_COURSES,
      {
        match: /courses\/c1\/courseWork/,
        body: {
          courseWork: [
            {
              id: "w1",
              title: "Chapter 7 quiz",
              maxPoints: 20,
              dueDate: { year: 2026, month: 9, day: 8 },
              updateTime: "2026-09-01T00:00:00Z",
            },
          ],
        },
      },
      { match: /courses\/c2\/courseWork/, body: { courseWork: [] } },
    ]);

    const page = await client.list(ORG, "assignment", null, null);
    expect(calls.some((u) => u.includes("/courses/c1/courseWork"))).toBe(true);
    expect(page.records[0].id).toBe("c1::w1");
    expect(page.records[0].payload.dueDate).toBe("2026-09-08");
    expect(page.records[0].payload.maxPoints).toBe(20);
  });

  it("reads grades three levels down and advances course, then coursework", async () => {
    const { client } = harness([
      TWO_COURSES,
      { match: /courses\/c1\/courseWork\?/, body: { courseWork: [{ id: "w1", title: "Quiz", maxPoints: 20 }] } },
      {
        match: /courses\/c1\/courseWork\/w1\/studentSubmissions/,
        body: {
          studentSubmissions: [
            { id: "s1", userId: "u1", assignedGrade: 18, state: "TURNED_IN", updateTime: "2026-09-01T00:00:00Z" },
          ],
        },
      },
      { match: /courses\/c2\/courseWork\?/, body: { courseWork: [] } },
    ]);

    const page = await client.list(ORG, "grade", null, null);
    expect(page.records[0].payload.assignedGrade).toBe(18);
    expect(page.records[0].payload.assignmentTitle).toBe("Quiz");
    expect(page.records[0].payload.maxPoints).toBe(20);
    // c1 has one coursework and no more pages, so the cursor moves to course 2.
    expect(page.nextCursor).toBe("1|0|");
  });

  it("returns nothing for attendance and schedule instead of inventing rows", async () => {
    const { client, calls } = harness([TWO_COURSES]);

    const attendance = await client.list(ORG, "attendance", null, null);
    const schedule = await client.list(ORG, "schedule", null, null);

    expect(attendance.records).toHaveLength(0);
    expect(schedule.records).toHaveLength(0);
    // Google Classroom has no attendance API and no timetable. Not calling is the
    // correct behaviour; a fixture would have filled these in.
    expect(calls).toHaveLength(0);
  });

  it("does not emit the legacy class alias, which would duplicate every course", async () => {
    const { client, calls } = harness([TWO_COURSES]);
    const page = await client.list(ORG, "class", null, null);
    expect(page.records).toHaveLength(0);
    expect(calls).toHaveLength(0);
  });

  it("refreshes once on 401 and retries", async () => {
    let courseCalls = 0;
    const impl = vi.fn(async (url: string) => {
      if (url.includes("oauth2.googleapis.com/token")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: "access-2", expires_in: 3600 }),
          text: async () => "",
        } as unknown as Response;
      }
      courseCalls += 1;
      const unauthorized = courseCalls === 1;
      return {
        ok: !unauthorized,
        status: unauthorized ? 401 : 200,
        json: async () => (unauthorized ? {} : { courses: [{ id: "c1", name: "Algebra II" }] }),
        text: async () => "",
      } as unknown as Response;
    });

    const persisted: string[] = [];
    const client = createGoogleClassroomClient({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      clientId: "cid",
      clientSecret: "csecret",
      fetchImpl: impl as never,
      onTokenRefreshed: (t) => {
        persisted.push(t.accessToken);
      },
    });

    const page = await client.list(ORG, "course", null, null);
    expect(page.records).toHaveLength(1);
    expect(courseCalls).toBe(2);
    expect(persisted).toEqual(["access-2"]);
  });

  it("surfaces a missing-scope 403 as an error naming the problem", async () => {
    const { client } = harness([
      {
        match: /\/v1\/courses/,
        status: 403,
        body: { error: { message: "Request had insufficient authentication scopes." } },
      },
    ]);

    await expect(client.list(ORG, "course", null, null)).rejects.toThrow(/insufficient authentication scopes/);
  });

  it("authenticate proves the token AND the Classroom scopes with one cheap call", async () => {
    const { client, calls } = harness([{ match: /\/v1\/courses/, body: { courses: [] } }]);
    const result = await client.authenticate({ accessToken: "access-1" });

    expect(result.ok).toBe(true);
    expect(calls[0]).toContain("pageSize=1");
  });

  it("authenticate fails when Google refuses — no more ok-for-any-string", async () => {
    const { client } = harness([{ match: /\/v1\/courses/, status: 401, body: {} }]);
    const result = await client.authenticate({ accessToken: "" });
    expect(result.ok).toBe(false);
  });
});

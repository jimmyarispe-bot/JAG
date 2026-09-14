import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ADMISSIONS_PIPELINE_STAGES } from "@/lib/admissions/registry/stages";

/**
 * The database's stage→task map must not drift from the code's.
 *
 * Migration 360 puts a trigger on admissions_leads so a follow-up task is
 * created whenever lead_stage changes — by the app, the bulk import, the public
 * form, or hand-written SQL. Before it, createStageAutomatedTasks() ran only
 * from transitionLeadStage(), which half the writes never call; that is why 316
 * found 113 families with no task and 359 found 69 more, five days apart.
 *
 * The trigger reads `admissions_stage_tasks`. That table is a SECOND copy of a
 * map whose first copy is TypeScript — registry/stages.ts and
 * STANDARD_AUTOMATED_TASKS in workflow.ts. Two copies of anything drift, and
 * this pair drifting means a family silently stops being followed up.
 *
 * So this reads the seed out of the migration and compares it to the registry.
 * It cannot reach production, and it is not a substitute for looking; what it
 * catches is somebody changing a task name or a due date on one side only.
 */

const root = join(__dirname, "..", "..", "..");
const migration = readFileSync(
  join(root, "supabase/migrations/360_stage_tasks_fire_on_the_stage_change_2026_09_14.sql"),
  "utf8"
);

/** The VALUES block of the seed, as (stage → {name, days}). */
function seededMap(): Map<string, { task: string; days: number }> {
  const start = migration.indexOf("insert into public.admissions_stage_tasks");
  const end = migration.indexOf("on conflict", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);

  const block = migration.slice(start, end);
  const rows = [...block.matchAll(/\('([a-z_]+)',\s*'([^']+)',\s*(\d+)\)/g)];
  return new Map(rows.map((m) => [m[1], { task: m[2], days: Number(m[3]) }]));
}

describe("the seeded map is well formed", () => {
  it("seeds the eight stages that have a task", () => {
    expect(seededMap().size).toBe(8);
  });

  /**
   * A closed stage must create nothing. A family who declined does not need
   * chasing, and a task on an enrolled student is noise in somebody's queue.
   */
  it("never seeds a closed stage", () => {
    const map = seededMap();
    for (const closed of ["declined", "not_returning", "enrolled", "enrollment_complete"]) {
      expect(map.has(closed)).toBe(false);
    }
  });

  it("gives every task a name and a non-negative due offset", () => {
    for (const [stage, { task, days }] of seededMap()) {
      expect(task.length, stage).toBeGreaterThan(3);
      expect(days, stage).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("it agrees with the registry the application reads", () => {
  /** THE ONE THAT MATTERS. Same stage, same words, same number of days. */
  it("matches every registry stage that defines an automated task", () => {
    const map = seededMap();
    const mismatches: string[] = [];

    for (const stage of ADMISSIONS_PIPELINE_STAGES) {
      const fromCode = stage.automatedTask;
      if (!fromCode) continue;

      // The registry is keyed by pipeline stage; the table by lead stage. Only
      // compare where a row of that exact name exists — the lead-stage aliases
      // are checked by name below rather than guessed at here.
      const fromDb = map.get(stage.key);
      if (!fromDb) continue;

      if (fromDb.task !== fromCode.taskName || fromDb.days !== fromCode.dueDays) {
        mismatches.push(
          `${stage.key}: db="${fromDb.task}"/${fromDb.days}d vs code="${fromCode.taskName}"/${fromCode.dueDays}d`
        );
      }
    }

    expect(mismatches).toEqual([]);
  });

  /**
   * Every task name in the table must be a name the code also uses. A name that
   * exists only in SQL means the trigger creates work the application does not
   * recognise, and the idempotency guards in 316, 359 and 360 all key on the
   * name — so a typo here creates a duplicate for every family, forever.
   */
  it("uses no task name the code does not know", () => {
    const known = new Set(
      ADMISSIONS_PIPELINE_STAGES.flatMap((s) => (s.automatedTask ? [s.automatedTask.taskName] : []))
    );
    // STANDARD_AUTOMATED_TASKS names that are not in the registry.
    for (const extra of [
      "Follow up on information sent",
      "Enrollment follow-up",
      "Follow up on records request",
      "Follow up on application progress",
    ]) {
      known.add(extra);
    }

    for (const [stage, { task }] of seededMap()) {
      expect(known.has(task), `${stage} → "${task}"`).toBe(true);
    }
  });
});

describe("the trigger is wired the way the comment claims", () => {
  const code = migration.replace(/--.*$/gm, "");

  it("fires on insert and on a lead_stage update, not on every edit", () => {
    expect(code).toMatch(/after insert or update of lead_stage on public\.admissions_leads/);
  });

  /** The public form writes lead_stage anonymously; RLS would refuse its insert. */
  it("runs as definer with a pinned search_path", () => {
    expect(code).toContain("security definer");
    expect(code).toContain("set search_path = public, pg_temp");
  });

  it("does not create a second open task of the same name", () => {
    expect(code).toMatch(/if exists \([\s\S]{0,220}task_status = 'open'[\s\S]{0,120}return new;/);
  });

  /** Tasks are staff notes. Messages to families stay behind the gate. */
  it("never touches the automation gate", () => {
    expect(code).not.toContain("automation_started_at");
  });

  it("skips archived leads", () => {
    expect(code).toMatch(/new\.archived_at is not null[\s\S]{0,60}return new;/);
  });
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 361 — reminders anchored on the appointment, not on the booking.
 *
 * interview_scheduled and shadow_day_scheduled had no task defined anywhere in
 * the codebase: somebody booked an interview and nothing was ever created to
 * make sure it happened. tour_scheduled had one, in TypeScript, that only ran
 * from transitionLeadStage() — so FL's three never got it.
 *
 * 360's map stores "N days after entering the stage", which is the wrong shape:
 * book a tour a month out and the reminder fires four weeks early. 361 adds an
 * anchor so due_days can count from the appointment itself, and go negative.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const m361 = readFileSync(
  join(root, "supabase/migrations/361_reminders_before_the_date_2026_09_14.sql"),
  "utf8"
);
const sql361 = m361.replace(/--.*$/gm, "");

describe("appointment reminders land before the appointment", () => {
  it("adds the anchor and allows a negative offset", () => {
    expect(sql361).toContain("add column if not exists anchor text");
    expect(sql361).toContain("check (anchor in ('stage_entry', 'scheduled_event'))");
    expect(sql361).toContain("drop constraint if exists admissions_stage_tasks_due_days_check");
  });

  /** THE ONE THAT MATTERS. A positive offset here would remind after the event. */
  it("seeds all three scheduled stages one day BEFORE", () => {
    for (const stage of ["tour_scheduled", "interview_scheduled", "shadow_day_scheduled"]) {
      const row = new RegExp(`\\('${stage}',\\s*'[^']+',\\s*(-?\\d+),\\s*'scheduled_event'\\)`);
      const found = sql361.match(row);
      expect(found, stage).not.toBeNull();
      expect(Number(found![1]), stage).toBeLessThan(0);
    }
  });

  it("reads tours from tours and interviews from interviews", () => {
    expect(sql361).toMatch(/lead_stage = 'tour_scheduled'[\s\S]{0,200}admissions_tours/);
    expect(sql361).toMatch(/else[\s\S]{0,200}admissions_interviews/);
  });

  /**
   * A reminder for an appointment that already happened is noise. Both guards
   * matter: no date means create nothing rather than guess one from today.
   */
  it("creates nothing for a past date, and nothing without a date", () => {
    expect(sql361).toMatch(/if event_at is null then[\s\S]{0,60}return new;/);
    expect(sql361).toMatch(/if event_at < now\(\) then[\s\S]{0,60}return new;/);
  });

  it("still refuses to duplicate an open task of the same name", () => {
    expect(sql361).toMatch(/if exists \([\s\S]{0,220}task_status = 'open'[\s\S]{0,120}return new;/);
  });

  /** Staff notes, not messages. The gate is not this migration's business. */
  it("never touches the automation gate", () => {
    expect(sql361).not.toContain("automation_started_at");
  });

  /**
   * A stage claiming an appointment with none on record is a contradiction
   * somebody has to look at. Skipping it silently is how these families became
   * invisible in the first place.
   */
  it("is loud about a stage with no appointment behind it", () => {
    expect(sql361).toContain("Stage says scheduled but no appointment is on record");
  });
});

-- 289: a record of what the nightly job runner actually did.
--
-- /api/platform/process-queues has run every night at midnight UTC and
-- answered `{success: true}` every time — whether it drained every queue or
-- found nothing anywhere, because it could not tell those apart. It
-- authenticated with a cookie-bound client on a request that carries no
-- cookies, so RLS returned zero rows everywhere and the run looked clean.
--
-- The code fix is in the route. This is the part that makes the failure
-- VISIBLE next time: a row per run saying how many jobs ran, how long it took,
-- and which failed. "The cron did nothing last night" stops being an inference
-- from the absence of side effects and becomes a fact you can select.
--
-- Every scheduled thing in JAG sits on that runner — the admissions workflow
-- and communication queues, tour reminders, medical document expiry alerts,
-- disengaged-family detection, attendance notifications, SPED review reminders,
-- finance and instruction reminders, and every nightly sync and snapshot.
--
-- IDEMPOTENT.

begin;

create table if not exists public.platform_job_runs (
  id uuid primary key default gen_random_uuid(),

  -- 'cron' is the machine caller on the CRON_SECRET path, which runs under the
  -- service role. 'human' is somebody triggering it from Mission Control, who
  -- runs as themselves. Recorded because the two see different data and a run
  -- that only ever succeeds by hand is worth being able to notice.
  triggered_by text not null check (triggered_by in ('cron', 'human')),

  jobs_run      int not null check (jobs_run >= 0),
  failure_count int not null default 0 check (failure_count >= 0),
  duration_ms   int not null check (duration_ms >= 0),

  -- The failures themselves, as [{name, error}]. Kept rather than counted only:
  -- knowing three jobs failed is not knowing which, and by the time anyone
  -- looks the logs are gone.
  failures jsonb not null default '[]'::jsonb,

  ran_at timestamptz not null default now()
);

create index if not exists idx_platform_job_runs_ran_at
  on public.platform_job_runs (ran_at desc);

comment on table public.platform_job_runs is
  'One row per nightly job-runner execution. Exists because the runner spent '
  'months reporting success while doing nothing, and nothing recorded enough '
  'to notice.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
--
-- Readable by the people who would investigate a quiet night. Not writable by
-- anyone through a normal session: the only writer is the runner itself, on the
-- service-role path, which bypasses RLS. There is deliberately NO insert policy
-- — a row here should mean "the job ran", and a row anybody could write would
-- mean nothing at all.

alter table public.platform_job_runs enable row level security;

drop policy if exists platform_job_runs_read on public.platform_job_runs;
create policy platform_job_runs_read on public.platform_job_runs
  for select using (
    has_permission('mission_control.access')
    or has_role('CEO')
    or has_role('FOUNDER')
  );

commit;

-- Empty until the next run. After tonight's, this should show one row with a
-- non-zero jobs_run — and if failure_count is high, the failures column names
-- every job that broke.
select triggered_by, jobs_run, failure_count, duration_ms, ran_at
from public.platform_job_runs
order by ran_at desc
limit 20;

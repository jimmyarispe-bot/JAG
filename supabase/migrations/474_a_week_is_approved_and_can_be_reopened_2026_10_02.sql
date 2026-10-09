-- 474_a_week_is_approved_and_can_be_reopened_2026_10_02.sql
--
-- Two holes found on 2 October, both in the part of the platform that pays
-- people, and both silent.
--
-- ONE: NOTHING EVER WROTE frozen_total_cents. The column was created by 453
-- with a comment saying the submit function writes it. submitWeekAction does
-- not. No trigger does either. So a submitted week was never a record of what
-- was owed - the payroll screen rebuilt every teacher's total from the
-- catalogue each time it was opened. Change a course rate and every week
-- already filed silently changes with it, with no trace that it ever said
-- anything else.
--
-- TWO: A SUBMITTED WEEK COULD NOT BE REOPENED. Once status was 'submitted',
-- myOpenWeek refused every action and nothing anywhere set it back. A teacher
-- who submitted a week with a class missing had no route but a database edit.
--
-- WHERE THE AMOUNT IS LOCKED, AND WHY THERE. Jimmy, 2 October: at approval,
-- on the payroll screen. The figure written is the one the person paying
-- actually looked at, and approving leaves a record of which weeks have been
-- signed off - which there was no way to tell before. Between submit and
-- approval the total is still computed live, and that is honest: nobody has
-- agreed to it yet.
--
-- THE AMOUNT IS PASSED IN, AND THAT IS A DELIBERATE CHOICE WITH A COST.
-- Pricing lives in TypeScript - rates.ts and week-view.ts, with tests. Making
-- the database recompute it would mean two implementations of how a class is
-- priced, and two implementations of money drift. So approve_teacher_week
-- takes the figure the screen displayed. It cannot be called by a teacher:
-- may_administer_teacher_pay() is Jimmy and Danni, checked inside the
-- function because security definer runs past RLS.
--
-- A REOPEN IS NEVER INVISIBLE. It clears the frozen amount, sets the week
-- back to open, and writes a row saying who reopened it, when, from what
-- status, at what amount, and why. A reason is required, not optional - a
-- week that was reopened and resubmitted must never look like one that was
-- right the first time.

begin;

-- ---------------------------------------------------------------------------
-- 1. 'approved' is a third status
-- ---------------------------------------------------------------------------

alter table public.teacher_weeks
  drop constraint if exists teacher_weeks_status_check;

alter table public.teacher_weeks
  add constraint teacher_weeks_status_check
  check (status in ('open', 'submitted', 'approved'));

alter table public.teacher_weeks
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null;

/*
 * The old coherence constraint knew two statuses. Rewritten for three, and it
 * is what stops a week being approved with no amount on it - which would put
 * us straight back where we started.
 */
alter table public.teacher_weeks
  drop constraint if exists teacher_weeks_submission_coherent;

alter table public.teacher_weeks
  add constraint teacher_weeks_submission_coherent check (
    (status = 'open'
      and submitted_at is null
      and approved_at is null
      and frozen_total_cents is null)
    or
    (status = 'submitted'
      and submitted_at is not null
      and approved_at is null
      and frozen_total_cents is null)
    or
    (status = 'approved'
      and submitted_at is not null
      and approved_at is not null
      and frozen_total_cents is not null)
  );

comment on column public.teacher_weeks.frozen_total_cents is
  'Written once, by approve_teacher_week(), and by nothing else. It is the '
  'figure the person paying had in front of them when they approved. Null '
  'while the week is open or merely submitted, and the total is computed on '
  'read until then.';

-- ---------------------------------------------------------------------------
-- 2. Every reopening, on the record
-- ---------------------------------------------------------------------------

create table if not exists public.teacher_week_reopenings (
  id                 uuid primary key default gen_random_uuid(),
  teacher_week_id    uuid not null references public.teacher_weeks(id) on delete cascade,
  reopened_by        uuid references auth.users(id) on delete set null,
  reopened_at        timestamptz not null default now(),
  previous_status    text not null,
  previous_total_cents integer,
  reason             text not null check (length(btrim(reason)) >= 3)
);

create index if not exists idx_teacher_week_reopenings_week
  on public.teacher_week_reopenings (teacher_week_id, reopened_at desc);

comment on table public.teacher_week_reopenings is
  'Why a week went back to open. A reopened week must never be mistaken for '
  'one that was right the first time. Append only - rows are never updated '
  'or deleted.';

alter table public.teacher_week_reopenings enable row level security;

/* Jimmy and Danni read it. The teacher whose week it is reads her own. */
drop policy if exists teacher_week_reopenings_read on public.teacher_week_reopenings;
create policy teacher_week_reopenings_read
  on public.teacher_week_reopenings for select
  using (
    public.may_read_all_teacher_pay()
    or public.teacher_week_is_readable(teacher_week_id)
  );

/* Nobody writes it from a client. Only the function below, which is definer. */
drop policy if exists teacher_week_reopenings_write on public.teacher_week_reopenings;
create policy teacher_week_reopenings_write
  on public.teacher_week_reopenings for all
  using (false) with check (false);

-- ---------------------------------------------------------------------------
-- 3. Approve
-- ---------------------------------------------------------------------------

create or replace function public.approve_teacher_week(
  p_week_id uuid,
  p_total_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if not coalesce(public.may_administer_teacher_pay(), false) then
    raise exception 'Only Jimmy and Danni approve a week.';
  end if;

  if p_total_cents is null or p_total_cents < 0 then
    raise exception 'A week cannot be approved without an amount.';
  end if;

  select status into v_status from public.teacher_weeks where id = p_week_id;

  if v_status is null then
    raise exception 'That week does not exist.';
  end if;

  if v_status = 'approved' then
    raise exception 'That week is already approved. Reopen it first if it needs changing.';
  end if;

  if v_status <> 'submitted' then
    raise exception 'Only a submitted week can be approved. This one is %.', v_status;
  end if;

  update public.teacher_weeks
     set status             = 'approved',
         approved_at        = now(),
         approved_by        = auth.uid(),
         frozen_total_cents = p_total_cents,
         updated_at         = now()
   where id = p_week_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Reopen
-- ---------------------------------------------------------------------------

create or replace function public.reopen_teacher_week(
  p_week_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_total  integer;
begin
  if not coalesce(public.may_administer_teacher_pay(), false) then
    raise exception 'Only Jimmy and Danni reopen a week.';
  end if;

  if p_reason is null or length(btrim(p_reason)) < 3 then
    raise exception 'Say why the week is being reopened. It goes on the record.';
  end if;

  select status, frozen_total_cents into v_status, v_total
    from public.teacher_weeks where id = p_week_id;

  if v_status is null then
    raise exception 'That week does not exist.';
  end if;

  if v_status = 'open' then
    raise exception 'That week is already open.';
  end if;

  /* Written BEFORE the week changes, so the row records what was undone. */
  insert into public.teacher_week_reopenings
    (teacher_week_id, reopened_by, previous_status, previous_total_cents, reason)
  values (p_week_id, auth.uid(), v_status, v_total, btrim(p_reason));

  update public.teacher_weeks
     set status             = 'open',
         submitted_at       = null,
         submitted_by       = null,
         approved_at        = null,
         approved_by        = null,
         frozen_total_cents = null,
         updated_at         = now()
   where id = p_week_id;
end;
$$;

revoke all on function public.approve_teacher_week(uuid, integer) from public;
revoke all on function public.reopen_teacher_week(uuid, text)     from public;
grant execute on function public.approve_teacher_week(uuid, integer) to authenticated;
grant execute on function public.reopen_teacher_week(uuid, text)     to authenticated;

commit;

notify pgrst, 'reload schema';

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT four rows: both functions present, the reopenings table present, and
-- the status constraint naming all three statuses.

select 'function' as kind, p.proname as name,
       pg_get_function_identity_arguments(p.oid) as detail
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('approve_teacher_week', 'reopen_teacher_week')

union all

select 'table', 'teacher_week_reopenings',
       (select count(*)::text || ' column(s)' from information_schema.columns
         where table_schema = 'public' and table_name = 'teacher_week_reopenings')
 where exists (select 1 from information_schema.tables
                where table_schema = 'public' and table_name = 'teacher_week_reopenings')

union all

select 'constraint', 'teacher_weeks_status_check', pg_get_constraintdef(c.oid)
  from pg_constraint c
 where c.conname = 'teacher_weeks_status_check'

order by 1, 2;

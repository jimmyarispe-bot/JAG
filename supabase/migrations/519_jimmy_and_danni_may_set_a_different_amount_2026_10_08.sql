-- ==========================================================================
-- 519 — JIMMY AND DANNI MAY SET A DIFFERENT AMOUNT
--
-- 8 October 2026. Run top to bottom. The last statement verifies.
--
-- ── WHY ───────────────────────────────────────────────────────────────────
--
-- Jimmy, 8 October 2026, paysheet change 4 of 6:
--
--     "this function only for me - add ability to enter a different pay
--      amount than what the jag figured"
--
-- and, asked who: **Jimmy AND Danni**, keeping to the standing rule that
-- only those two see anything to do with money.
--
-- ── WHAT THIS ADDS, AND WHAT IT DELIBERATELY DOES NOT ─────────────────────
--
--   teacher_weeks.override_total_cents  integer, nullable
--   teacher_weeks.override_reason       text
--   teacher_weeks.override_by           uuid -> users(id)
--   teacher_weeks.override_at           timestamptz
--
-- IT DOES NOT OVERWRITE WHAT THE JAG COMPUTED. The computed figure stays
-- exactly where it is and keeps being computed. The override sits BESIDE it.
--
-- A paysheet read in March has to answer two different questions: what did
-- the platform work out, and what did a person decide to pay. Collapse them
-- into one number and the second question becomes unanswerable - an
-- override is then indistinguishable from a bug in the rate table, which is
-- the single worst thing that can happen to a pay record nobody can
-- reconstruct.
--
-- THE REASON IS REQUIRED. Not a dropdown: the useful reasons are never on
-- the list. Renee Tracewell's week is the example - "guest cover combined
-- into her own class, agreed $X" is a sentence, not a category.
--
-- ── WHY A FUNCTION AND NOT A POLICY ───────────────────────────────────────
--
-- Migration 462 says it plainly: "Row-level security cannot restrict a
-- single column". The override is four columns on a row a teacher may
-- otherwise edit, so a policy cannot express "these two people, these four
-- columns, nobody else".
--
-- So the write goes through a security definer function that checks the
-- caller's role itself - the same shape as mint_application_access_token
-- (412) and students_a_teacher_may_log (468).
--
-- AND THE TEACHER'S OWN UPDATE POLICY IS TIGHTENED TO MATCH. Without that
-- last part this migration would be worse than nothing: teacher_weeks_update
-- pins `frozen_total_cents is null` and says nothing about any other column,
-- so a teacher could set her own override on her own open week. The policy
-- is recreated below with the override pinned null, exactly as the figure
-- already is.
--
-- Idempotent. Safe to re-run.
-- ==========================================================================

begin;

-- 1 ---------------------------------------------------------------- COLUMNS
alter table public.teacher_weeks
  add column if not exists override_total_cents integer;

alter table public.teacher_weeks
  add column if not exists override_reason text;

alter table public.teacher_weeks
  add column if not exists override_by uuid references public.users(id) on delete set null;

alter table public.teacher_weeks
  add column if not exists override_at timestamptz;

comment on column public.teacher_weeks.override_total_cents is
  'What Jimmy or Danni decided to pay, when that differs from what the JAG '
  'computed. BESIDE the computed figure, never instead of it: a paysheet '
  'read months later must still show both what was worked out and what was '
  'decided. Null means pay what was computed.';

comment on column public.teacher_weeks.override_reason is
  'Why, in their own words. Required by set_teacher_week_override. Not a '
  'dropdown - the useful reasons are never on the list.';

-- 2 ------------------------------------------- THE TEACHER CANNOT SET IT
-- 462 pinned frozen_total_cents null here and nothing else. Recreated with
-- the override pinned too. Without this the columns above would be writable
-- by the very person they exist to decide about.
drop policy if exists teacher_weeks_update on public.teacher_weeks;

create policy teacher_weeks_update
  on public.teacher_weeks
  for update
  using (
    public.current_employee_id() is not null
    and employee_id = public.current_employee_id()
    and status = 'open'
  )
  with check (
    employee_id = public.current_employee_id()
    and frozen_total_cents is null
    /* Added 8 October 2026 (519). An open week has no override on it, so
       pinning null costs a teacher nothing and closes the column. */
    and override_total_cents is null
    and override_reason is null
    and override_by is null
    and override_at is null
  );

-- 3 ------------------------------------------------------------ THE WRITE
create or replace function public.set_teacher_week_override(
  p_week_id uuid,
  p_cents   integer,
  p_reason  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  /* Jimmy and Danni. Checked HERE rather than by a policy, because the
     thing being restricted is a set of columns and a policy cannot see
     columns. */
  if not (
    coalesce(has_role('FOUNDER'), false)
    or coalesce(has_role('EXECUTIVE_DIRECTOR'), false)
  ) then
    raise exception 'Only Jimmy or Danni may set a different amount.';
  end if;

  /* Clearing it is allowed and needs no reason: going back to what the JAG
     computed is not a decision that needs defending. Setting one does. */
  if p_cents is null then
    update public.teacher_weeks
    set override_total_cents = null,
        override_reason      = null,
        override_by          = null,
        override_at          = null,
        updated_at           = now()
    where id = p_week_id;
    return;
  end if;

  if p_cents < 0 then
    raise exception 'A week cannot pay a negative amount.';
  end if;

  if coalesce(trim(p_reason), '') = '' then
    raise exception
      'Say why the amount is different. A figure somebody changed with no '
      'reason on it is indistinguishable from a fault six weeks later.';
  end if;

  update public.teacher_weeks
  set override_total_cents = p_cents,
      override_reason      = trim(p_reason),
      override_by          = v_actor,
      override_at          = now(),
      updated_at           = now()
  where id = p_week_id;

  if not found then
    raise exception 'That week could not be found.';
  end if;
end;
$$;

revoke all on function public.set_teacher_week_override(uuid, integer, text) from public;
grant execute on function public.set_teacher_week_override(uuid, integer, text) to authenticated;

comment on function public.set_teacher_week_override(uuid, integer, text) is
  'Paysheet change 4 of 6, 8 October 2026. Jimmy or Danni set what a week '
  'actually pays when it differs from the computed figure. Security definer '
  'because the restriction is on COLUMNS, which row-level security cannot '
  'express - see migration 462. A null amount clears the override and needs '
  'no reason; setting one requires a sentence.';

-- 4 ---------------------------------------------------- ASSERT, THEN COMMIT
do $$
declare
  cols int;
  fn   int;
begin
  select count(*) into cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'teacher_weeks'
    and column_name in ('override_total_cents','override_reason','override_by','override_at');

  if cols <> 4 then
    raise exception '519: expected 4 override columns on teacher_weeks, found %', cols;
  end if;

  select count(*) into fn
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'set_teacher_week_override';

  if fn <> 1 then
    raise exception '519: set_teacher_week_override did not create (found %)', fn;
  end if;
end $$;

commit;

-- ── SEE IT DONE ──────────────────────────────────────────────────────────
select
  'column'                                        as thing,
  c.column_name                                   as name,
  c.data_type                                     as detail,
  c.is_nullable                                   as nullable
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'teacher_weeks'
  and c.column_name in ('override_total_cents','override_reason','override_by','override_at')

union all

select
  'function',
  p.proname,
  pg_get_function_identity_arguments(p.oid),
  case when p.prosecdef then 'security definer' else 'invoker' end
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'set_teacher_week_override'

union all

select
  'policy',
  pol.polname,
  'teacher_weeks update — override now pinned null for teachers',
  case when pol.polcmd = 'w' then 'update' else pol.polcmd::text end
from pg_policy pol
join pg_class cl on cl.oid = pol.polrelid
where cl.relname = 'teacher_weeks' and pol.polname = 'teacher_weeks_update'

order by thing, name;

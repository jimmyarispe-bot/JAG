-- ===========================================================================
-- I COVERED A CLASS FOR SOMEONE  -  406  -  2026-09-21
--
-- Jimmy, 21 September: a teacher is absent and one of the other twelve takes
-- her class, either as its own class or by absorbing the children into one of
-- their own. This file is the first case. Absorption is next.
--
-- NOTHING IN THE PLATFORM COULD RECORD COVER. No screen writes
-- instructional_sessions.instructor_employee_id, and no teacher could: TEACHER
-- holds scheduling.view and scheduling.attendance, not scheduling.manage. That
-- is correct - a teacher should not be able to edit the network's timetable.
-- So the claim goes through functions that do exactly one thing each, rather
-- than through a permission that would let her do anything.
--
-- PAY NEEDS NO CHANGES. computeClassPay() already prices a session at the
-- guest rate when its instructor differs from the section's usual one, and
-- since migration 401 the guest rate IS the normal rate: $20 + $5. Move the
-- session's instructor and the money follows by itself.
--
-- THE ORIGINAL TEACHER IS NOT ERASED. original_instructor_employee_id keeps
-- whose class it was, so her own timesheet can still show the class with
-- "covered by" against it instead of the row silently vanishing from her week.
-- A class that disappears without explanation is how a teacher loses trust in
-- a pay screen.
--
-- A SUBMITTED WEEK IS A RECEIPT - FOR BOTH OF THEM. A claim is refused if
-- either teacher has already submitted that week. Moving a class out of a
-- signed-off week would change what that signature meant without changing the
-- signature.
--
-- AND IT CAN BE UNDONE. release_claimed_class() puts the class back. A
-- mis-tap at eleven o'clock on a Friday must not be permanent.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Remember whose class it was.
-- ---------------------------------------------------------------------------

alter table public.instructional_sessions
  add column if not exists original_instructor_employee_id uuid
    references public.employees(id) on delete set null;

alter table public.instructional_sessions
  add column if not exists cover_claimed_at timestamptz;

comment on column public.instructional_sessions.original_instructor_employee_id is
  'Whose class this was before somebody covered it. NULL means nobody has. Kept '
  'so the absent teacher still sees the class on her own week marked as covered, '
  'rather than the row vanishing without explanation.';

-- ---------------------------------------------------------------------------
-- 2. Which classes could I have covered on a given day.
--
--    Bounded deliberately: classes at MY OWN SCHOOL, on that date, that are
--    not already mine. A teacher does not need to browse the network's
--    timetable to say she covered a colleague's class.
-- ---------------------------------------------------------------------------

create or replace function public.classes_i_could_cover(p_on_date date)
returns table (
  session_id   uuid,
  starts_at    timestamptz,
  course_name  text,
  section_code text,
  teacher_name text,
  already_covered boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select e.id, e.school_id
    from public.employees e
    where e.user_id = auth.uid()
    limit 1
  )
  select
    i.id,
    i.scheduled_start,
    coalesce(c.name, 'Class'),
    coalesce(cs.section_code, ''),
    coalesce(
      nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''),
      p.display_name,
      'Another teacher'
    ),
    i.original_instructor_employee_id is not null
  from public.instructional_sessions i
  join public.course_sections cs on cs.id = i.course_section_id
  join public.courses c on c.id = cs.course_id
  join me on c.school_id = me.school_id
  left join public.employee_profiles p on p.employee_id = i.instructor_employee_id
  where (i.scheduled_start at time zone 'America/New_York')::date = p_on_date
    and coalesce(i.session_status, 'scheduled') <> 'cancelled'
    and i.instructor_employee_id is distinct from me.id
  order by i.scheduled_start;
$$;

comment on function public.classes_i_could_cover(date) is
  'Classes at the caller''s own school on that date that are not already hers - '
  'the list she picks from when saying she covered for a colleague.';

revoke all on function public.classes_i_could_cover(date) from public;
grant execute on function public.classes_i_could_cover(date) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Claim one.
-- ---------------------------------------------------------------------------

create or replace function public.claim_class_as_guest(p_session_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me        uuid;
  v_school    uuid;
  v_session   record;
  v_class_day date;
  v_week      date;
begin
  select e.id, e.school_id into v_me, v_school
  from public.employees e
  where e.user_id = auth.uid()
  limit 1;

  if v_me is null then
    return 'You are not set up as a teacher.';
  end if;

  select i.*, c.school_id as course_school_id
    into v_session
  from public.instructional_sessions i
  join public.course_sections cs on cs.id = i.course_section_id
  join public.courses c on c.id = cs.course_id
  where i.id = p_session_id;

  if not found then
    return 'That class could not be found.';
  end if;

  if v_session.course_school_id is distinct from v_school then
    return 'That class is not at your school.';
  end if;

  if v_session.instructor_employee_id = v_me then
    return 'That class is already yours.';
  end if;

  if coalesce(v_session.session_status, 'scheduled') = 'cancelled' then
    return 'That class was cancelled. It cannot be covered.';
  end if;

  v_class_day := (v_session.scheduled_start at time zone 'America/New_York')::date;
  v_week := date_trunc('week', v_class_day)::date;

  -- Neither receipt may be rewritten.
  if exists (
    select 1 from public.teacher_week_submissions w
    where w.week_start = v_week
      and w.status = 'submitted'
      and w.employee_id in (v_me, v_session.instructor_employee_id)
  ) then
    return 'That week has already been submitted. File an amendment instead.';
  end if;

  -- A person cannot be in two classrooms at once. If she was teaching her own
  -- class at that hour then this was an absorption, not a cover, and it is
  -- recorded the other way.
  if exists (
    select 1
    from public.instructional_sessions mine
    where mine.instructor_employee_id = v_me
      and coalesce(mine.session_status, 'scheduled') <> 'cancelled'
      and mine.id <> p_session_id
      and tstzrange(mine.scheduled_start, mine.scheduled_end, '[)')
          && tstzrange(v_session.scheduled_start, v_session.scheduled_end, '[)')
  ) then
    return 'You were teaching your own class at that time. If you took those '
        || 'children into your class instead, add them to it rather than '
        || 'claiming this one.';
  end if;

  update public.instructional_sessions
     set original_instructor_employee_id =
           coalesce(original_instructor_employee_id, instructor_employee_id),
         instructor_employee_id = v_me,
         cover_claimed_at = now(),
         updated_at = now()
   where id = p_session_id;

  return 'ok';
end $$;

comment on function public.claim_class_as_guest(uuid) is
  'A teacher records that she covered a colleague''s class. Moves the session to '
  'her, keeps whose it was, and refuses when either teacher has submitted that '
  'week or when she was teaching her own class at that hour.';

revoke all on function public.claim_class_as_guest(uuid) from public;
grant execute on function public.claim_class_as_guest(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Give it back.
-- ---------------------------------------------------------------------------

create or replace function public.release_claimed_class(p_session_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me      uuid;
  v_session record;
  v_week    date;
begin
  select e.id into v_me from public.employees e where e.user_id = auth.uid() limit 1;
  if v_me is null then
    return 'You are not set up as a teacher.';
  end if;

  select * into v_session from public.instructional_sessions where id = p_session_id;
  if not found then
    return 'That class could not be found.';
  end if;

  if v_session.instructor_employee_id is distinct from v_me then
    return 'That class is not yours to give back.';
  end if;

  if v_session.original_instructor_employee_id is null then
    return 'That class was always yours. There is nothing to give back.';
  end if;

  v_week := date_trunc('week', (v_session.scheduled_start at time zone 'America/New_York')::date)::date;

  if exists (
    select 1 from public.teacher_week_submissions w
    where w.week_start = v_week
      and w.status = 'submitted'
      and w.employee_id in (v_me, v_session.original_instructor_employee_id)
  ) then
    return 'That week has already been submitted. File an amendment instead.';
  end if;

  update public.instructional_sessions
     set instructor_employee_id = original_instructor_employee_id,
         original_instructor_employee_id = null,
         cover_claimed_at = null,
         updated_at = now()
   where id = p_session_id;

  return 'ok';
end $$;

revoke all on function public.release_claimed_class(uuid) from public;
grant execute on function public.release_claimed_class(uuid) to authenticated;

commit;

-- ===========================================================================
-- VERIFY.
-- ===========================================================================

-- 1. The three functions. EXPECT THREE ROWS, all security_definer=true.
select
  '1. functions'                            as check,
  p.proname                                  as detail,
  'security_definer=' || p.prosecdef::text   as extra
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('classes_i_could_cover', 'claim_class_as_guest', 'release_claimed_class')

union all

-- 2. The columns. EXPECT TWO ROWS.
select
  '2. columns on instructional_sessions',
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'instructional_sessions'
  and column_name in ('original_instructor_employee_id', 'cover_claimed_at')

union all

-- 3. Cover recorded so far. EXPECT ZERO - nothing here claims anything.
select
  '3. classes currently covered',
  'sessions with an original instructor',
  count(*)::text
from public.instructional_sessions
where original_instructor_employee_id is not null

order by 1, 2;

-- 4. CANNOT BE RUN HERE. Every function answers for auth.uid(); the SQL editor
--    is the service role and has none. classes_i_could_cover() will return
--    nothing here, and that is correct. The test is the screen.

-- 462_who_may_read_a_teachers_week_2026_10_01.sql
--
-- The policies migration 453 deliberately did not write.
--
-- 453 turned row-level security on for all six tables and created no policy,
-- which means nobody reads and nobody writes except the service role. Safe,
-- and unusable. Its own header said why it stopped there:
--
--   "The 21 September fault is the reason to be careful here: a policy that
--    looked right resolved to the wrong school and returned fewer rows with
--    no error. These policies will be written against named cases and
--    verified by signing in as a teacher, not by reading them."
--
-- That is what this is. The named cases are at the bottom, as a checklist to
-- be worked through signed in as a real teacher. Running this migration is
-- not the end of the job; the checklist is.
--
-- ============================================================================
-- WHO SEES WHAT - Jimmy, 1 October 2026
-- ============================================================================
--
-- A week holds every class a teacher taught and every child they scheduled.
-- Pay is derived from exactly those rows, so reading somebody's week IS
-- reading their pay. Asked directly, Jimmy's answer was his standing rule:
-- "only danni n me see anything related to money."
--
--   A teacher          their own week. Nobody else's. Ever.
--   Jimmy, Danni       every teacher's week - this is the payroll screen,
--                      items 21-23, and it is also the control the whole
--                      design depends on
--   Heather, Nina      nothing in these six tables
--
-- Closed is recoverable; open is not. If a school leader turns out to need
-- the attendance half, that is one policy added later, after a decision -
-- rather than pay having been visible in the meantime.
--
-- GATED ON ROLES, NOT ON A PERMISSION, AND THAT IS DELIBERATE.
--
-- has_permission('finance.view') looked like the natural predicate. It is
-- not, for two reasons found by looking rather than assuming:
--
--   1. has_permission() returns true for FOUNDER, CEO and EXECUTIVE_DIRECTOR
--      for EVERY permission in the catalogue, without a row existing. So the
--      predicate is not really about finance at all.
--   2. What a role holds in the DATABASE and what it holds in
--      permission-groups.ts are two different lists maintained separately.
--      The code file's own comments admit it: "SCHOOL_LEADER holds
--      mission_control.access and school.configure as real database rows".
--      Reading the code map and writing a policy against it is the 21
--      September mistake exactly.
--
-- So the predicate names the two roles, which do not depend on the permission
-- rows being right, and it lives in ONE function that every policy calls -
-- one place to audit, one place to change.
--
-- CAMPUS ASSIGNMENT IS NARROWER THAN ASKED, ON PURPOSE.
--
-- Jimmy: only Heather, Danni or he may assign a teacher to Virtual or HS, and
-- asked today he chose Heather BY NAME rather than by her role, so that Nina
-- does not inherit it.
--
-- This platform cannot express that. Permissions attach to ROLES through
-- user_roles; there is no per-user grant. Heather and Nina hold the same
-- role. Doing it by name would mean either a user id hardcoded inside a
-- database policy - which breaks the day she changes address or leaves, and
-- cannot be seen by anyone reading the role map - or a new role invented for
-- one person, which is not mine to create.
--
-- So writes here are Jimmy and Danni for now, and Heather asks one of them.
-- That is Jimmy's own third option, taken as the interim rather than guessed
-- at. Adding her is one line in may_administer_teacher_pay() once he picks
-- the mechanism.
--
-- A SUBMITTED WEEK IS FROZEN, AND NO CLIENT MAY WRITE THE MONEY.
--
-- Every write policy below turns on the parent week still being open. A
-- submitted week cannot be edited by the person who submitted it, and cannot
-- have classes or children added underneath it.
--
-- frozen_total_cents stays unwritable: the update policy's WITH CHECK demands
-- it is null. Row-level security cannot restrict a single column, so this is
-- how the column is held shut until the submit function arrives with the
-- screen. The old design's worst fault was a figure that arrived from the
-- browser; nothing here accepts one.
--
-- Safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- The two predicates, named once
-- ---------------------------------------------------------------------------

/*
 * May this person see every teacher's pay? Jimmy and Danni.
 *
 * SECURITY DEFINER so it reads roles without the caller needing to, and
 * STABLE so the planner may call it once per statement rather than per row.
 */
create or replace function public.may_read_all_teacher_pay()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(has_role('FOUNDER'), false)
      or coalesce(has_role('EXECUTIVE_DIRECTOR'), false);
$$;

comment on function public.may_read_all_teacher_pay() is
  'Jimmy and Danni. The standing rule: only they see anything related to '
  'money. Named by ROLE rather than by permission because has_permission() '
  'returns true for those roles for every key in the catalogue anyway, and '
  'because the database role map and the code role map are maintained apart.';

/*
 * May this person assign a teacher to a campus, or correct somebody else's
 * week? Jimmy and Danni today. Heather is intended and cannot yet be
 * expressed - see the header.
 */
create or replace function public.may_administer_teacher_pay()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.may_read_all_teacher_pay();
$$;

/*
 * Is this week mine, and still open?
 *
 * The single predicate every write policy hangs off. SECURITY DEFINER so it
 * can read teacher_weeks without recursing through that table's own policies,
 * and it makes its own ownership check rather than relying on one.
 *
 * current_employee_id() (migration 085) resolves the signed-in user to their
 * ACTIVE employee row. A teacher with no employee row, or an inactive one,
 * gets null here and therefore matches nothing - which is the correct answer
 * and not an error.
 */
create or replace function public.teacher_week_is_mine_and_open(week_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.teacher_weeks w
     where w.id = week_id
       and w.employee_id is not distinct from public.current_employee_id()
       and public.current_employee_id() is not null
       and w.status = 'open'
  );
$$;

/* The read half: mine whatever its status, or everyone's if payroll. */
create or replace function public.teacher_week_is_readable(week_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.may_read_all_teacher_pay()
      or exists (
           select 1
             from public.teacher_weeks w
            where w.id = week_id
              and public.current_employee_id() is not null
              and w.employee_id = public.current_employee_id()
         );
$$;

grant execute on function public.may_read_all_teacher_pay()        to authenticated, service_role;
grant execute on function public.may_administer_teacher_pay()      to authenticated, service_role;
grant execute on function public.teacher_week_is_mine_and_open(uuid) to authenticated, service_role;
grant execute on function public.teacher_week_is_readable(uuid)    to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1. teacher_campus_assignments
-- ---------------------------------------------------------------------------
drop policy if exists teacher_campus_assignments_read  on public.teacher_campus_assignments;
drop policy if exists teacher_campus_assignments_write on public.teacher_campus_assignments;

-- A teacher may see which campus they are assigned to. Their own row only.
create policy teacher_campus_assignments_read
  on public.teacher_campus_assignments
  for select
  using (
    public.may_read_all_teacher_pay()
    or (public.current_employee_id() is not null
        and employee_id = public.current_employee_id())
  );

-- One policy for insert, update and delete: nobody but payroll touches this.
create policy teacher_campus_assignments_write
  on public.teacher_campus_assignments
  for all
  using (public.may_administer_teacher_pay())
  with check (public.may_administer_teacher_pay());

-- ---------------------------------------------------------------------------
-- 2. teacher_weeks
-- ---------------------------------------------------------------------------
drop policy if exists teacher_weeks_read     on public.teacher_weeks;
drop policy if exists teacher_weeks_insert   on public.teacher_weeks;
drop policy if exists teacher_weeks_update   on public.teacher_weeks;

create policy teacher_weeks_read
  on public.teacher_weeks
  for select
  using (
    public.may_read_all_teacher_pay()
    or (public.current_employee_id() is not null
        and employee_id = public.current_employee_id())
  );

/*
 * A teacher opens their own week and nobody else's. status and
 * frozen_total_cents are both pinned here: a week is born open, with no
 * figure on it.
 */
create policy teacher_weeks_insert
  on public.teacher_weeks
  for insert
  with check (
    public.current_employee_id() is not null
    and employee_id = public.current_employee_id()
    and status = 'open'
    and frozen_total_cents is null
  );

/*
 * Editable only while open. The WITH CHECK allows open -> submitted, which is
 * how a teacher submits, and refuses any row that carries a figure - that
 * column belongs to the submit function, which arrives with the screen.
 *
 * Note what is missing: no DELETE policy. A teacher cannot delete their week.
 * Removing a class is a delete on teacher_class_entries, which they may do
 * while the week is open; discarding the week itself is not a thing the
 * screen offers and therefore not a thing the database allows.
 */
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
  );

-- ---------------------------------------------------------------------------
-- 3. teacher_class_entries
-- ---------------------------------------------------------------------------
drop policy if exists teacher_class_entries_read  on public.teacher_class_entries;
drop policy if exists teacher_class_entries_write on public.teacher_class_entries;

create policy teacher_class_entries_read
  on public.teacher_class_entries
  for select
  using (public.teacher_week_is_readable(teacher_week_id));

create policy teacher_class_entries_write
  on public.teacher_class_entries
  for all
  using (public.teacher_week_is_mine_and_open(teacher_week_id))
  with check (public.teacher_week_is_mine_and_open(teacher_week_id));

-- ---------------------------------------------------------------------------
-- 4. teacher_class_students   (two hops to the week)
-- ---------------------------------------------------------------------------
drop policy if exists teacher_class_students_read  on public.teacher_class_students;
drop policy if exists teacher_class_students_write on public.teacher_class_students;

create policy teacher_class_students_read
  on public.teacher_class_students
  for select
  using (
    exists (
      select 1 from public.teacher_class_entries e
       where e.id = entry_id
         and public.teacher_week_is_readable(e.teacher_week_id)
    )
  );

create policy teacher_class_students_write
  on public.teacher_class_students
  for all
  using (
    exists (
      select 1 from public.teacher_class_entries e
       where e.id = entry_id
         and public.teacher_week_is_mine_and_open(e.teacher_week_id)
    )
  )
  with check (
    exists (
      select 1 from public.teacher_class_entries e
       where e.id = entry_id
         and public.teacher_week_is_mine_and_open(e.teacher_week_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 5. teacher_extra_claims
-- ---------------------------------------------------------------------------
drop policy if exists teacher_extra_claims_read  on public.teacher_extra_claims;
drop policy if exists teacher_extra_claims_write on public.teacher_extra_claims;

create policy teacher_extra_claims_read
  on public.teacher_extra_claims
  for select
  using (public.teacher_week_is_readable(teacher_week_id));

/*
 * employee_id is denormalised onto this row so the monthly caps can be a
 * unique index. It is therefore also something a client could lie about, so
 * the check pins it to the person making the claim - a teacher cannot file
 * a coaching session against somebody else's monthly allowance.
 */
create policy teacher_extra_claims_write
  on public.teacher_extra_claims
  for all
  using (public.teacher_week_is_mine_and_open(teacher_week_id))
  with check (
    public.teacher_week_is_mine_and_open(teacher_week_id)
    and employee_id = public.current_employee_id()
  );

-- ---------------------------------------------------------------------------
-- 6. teacher_hourly_claims
-- ---------------------------------------------------------------------------
drop policy if exists teacher_hourly_claims_read  on public.teacher_hourly_claims;
drop policy if exists teacher_hourly_claims_write on public.teacher_hourly_claims;

create policy teacher_hourly_claims_read
  on public.teacher_hourly_claims
  for select
  using (public.teacher_week_is_readable(teacher_week_id));

create policy teacher_hourly_claims_write
  on public.teacher_hourly_claims
  for all
  using (public.teacher_week_is_mine_and_open(teacher_week_id))
  with check (public.teacher_week_is_mine_and_open(teacher_week_id));

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Every table, how many policies it now carries, and which commands they
-- cover. EXPECT six tables, each with a read policy and a write policy, and
-- teacher_weeks with three.
--
-- A table showing 0 is a table nobody can reach.

select tablename,
       count(*)                                             as policies,
       string_agg(cmd || ':' || policyname, '  ' order by policyname) as what
  from pg_policies
 where schemaname = 'public'
   and tablename in ('teacher_campus_assignments','teacher_weeks',
                     'teacher_class_entries','teacher_class_students',
                     'teacher_extra_claims','teacher_hourly_claims')
 group by tablename
 order by tablename;

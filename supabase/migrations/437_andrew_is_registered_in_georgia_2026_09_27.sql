-- Andrew Ribeiro's school of record becomes The Academy GA.
--
-- Jimmy, 27 September 2026: a student using state funding is registered at
-- the in-person campus of that state. Andrew is Georgia, GA Special Needs
-- only, no parent payments - and he is the ONLY student in the network the
-- rule moves today. The other four state-funded Virtual and HS students are
-- Arkansas, Arizona and North Carolina, where there is no campus to move
-- them to.
--
-- HIS CLASSES DO NOT MOVE. Four of his five sections are Virtual and one is
-- HS, and they stay exactly where they are. Enrollment is per section, pay
-- follows the course's school (migration 379), and none of that reads the
-- student's campus. What moves is the record: attendance, transcripts and
-- what Georgia is told.
--
-- HE MUST BE RENUMBERED, and this is the part that would have failed.
-- Student numbers are per-campus sequences with a unique index on
-- (school_id, student_number). Andrew is 000010 at The Academy HS, and
-- 000010 at The Academy GA is Dante Neason. Moving him without a new number
-- is refused by the database; moving him WITH one silently rewrites the
-- number on anything already printed. So the old number is kept, in a row,
-- rather than overwritten and forgotten.
--
-- WHY A TABLE AND NOT A COLUMN. This rule will move students again - every
-- GA or FL resident who enrolls on state funding while taking Virtual or HS
-- classes. A previous_student_number column holds one move and loses the
-- one before it. A student who moves twice is exactly the student whose
-- records somebody will later need to trace.
--
-- WHAT THIS DOES NOT DO:
--   * It does not create his GA Special Needs award. scholarship_awards has
--     no row for him at all - the only evidence is a tuition plan channel
--     reading state_direct. The award that justifies this move is not
--     recorded anywhere, and inventing one from a sentence in a chat would
--     be worse than leaving the gap visible.
--   * It does not touch his campus_id if he has one. A campus belongs to a
--     school and I have no mapping from an HS campus to a GA one; it is
--     reported below rather than guessed at.
--   * It does not give his guardian campus access. He has no user_schools
--     row at all today, so there is nothing to move - it becomes a GA row
--     whenever the parent portal reaches him.
--
-- Safe to re-run: it exits without writing if he is already at GA.

begin;

create table if not exists public.student_campus_moves (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null references public.students(id) on delete cascade,

  from_school_id uuid not null references public.schools(id) on delete restrict,
  to_school_id   uuid not null references public.schools(id) on delete restrict,

  -- Both numbers, because the number is campus-scoped and therefore changes.
  from_student_number text,
  to_student_number   text,

  -- Why, in words. A move with no reason is indistinguishable from a mistake.
  reason text not null,

  moved_at timestamptz not null default now(),
  moved_by uuid references public.users(id) on delete set null
);

comment on table public.student_campus_moves is
  'Every time a student''s school of record changed, with both campus-scoped '
  'student numbers. The history a transcript request needs when a number on '
  'an old document no longer matches the one on the record.';

alter table public.student_campus_moves enable row level security;

/* students.view and students.edit, because those are the permissions this
   platform actually has. My first draft said sis.view and sis.manage, which
   exist nowhere - the policies would have compiled, granted nothing to
   anybody but the Founder, and looked correct while quietly hiding a
   student's campus history from the people who need it. */
drop policy if exists student_campus_moves_read on public.student_campus_moves;
create policy student_campus_moves_read on public.student_campus_moves
  for select using (has_permission('students.view') or has_role('FOUNDER'));

drop policy if exists student_campus_moves_write on public.student_campus_moves;
create policy student_campus_moves_write on public.student_campus_moves
  for all using (has_permission('students.edit') or has_role('FOUNDER'))
  with check (has_permission('students.edit') or has_role('FOUNDER'));

do $$
declare
  v_student_id uuid;
  v_family_id  uuid;
  v_from       uuid;
  v_old_number text;
  v_ga         uuid;
  v_new_number text;
  v_campus_id  uuid;
begin
  select id, family_id, school_id, student_number, campus_id
    into v_student_id, v_family_id, v_from, v_old_number, v_campus_id
    from public.students
   where first_name = 'Andrew' and last_name = 'Ribeiro' and status = 'active';

  if v_student_id is null then
    raise exception 'No active student named Andrew Ribeiro.';
  end if;

  select id into v_ga from public.schools where lower(trim(name)) = 'the academy ga';
  if v_ga is null then
    raise exception 'The Academy GA not found.';
  end if;

  if v_from = v_ga then
    raise notice 'Andrew is already registered at The Academy GA. Nothing changed.';
    return;
  end if;

  -- The next number in Georgia's own sequence.
  select public.generate_student_number(v_ga) into v_new_number;

  if exists (
    select 1 from public.students
     where school_id = v_ga and student_number = v_new_number
  ) then
    raise exception 'Georgia already has student number %; refusing to collide.', v_new_number;
  end if;

  insert into public.student_campus_moves (
    student_id, from_school_id, to_school_id,
    from_student_number, to_student_number, reason
  )
  values (
    v_student_id, v_from, v_ga,
    v_old_number, v_new_number,
    'School of record follows state funding: GA Special Needs Scholarship, '
    'Georgia resident. Classes remain at The Academy HS and The Academy '
    'Virtual. Jimmy, 27 September 2026.'
  );

  update public.students
     set school_id      = v_ga,
         student_number = v_new_number,
         updated_at     = now()
   where id = v_student_id;

  -- The family follows the child. A family filed at one campus while their
  -- child is registered at another is how a parent ends up unable to see
  -- their own student.
  update public.families
     set school_id = v_ga
   where id = v_family_id;

  if v_campus_id is not null then
    raise notice
      'Andrew still carries campus_id % , which belongs to his old school. Decide where he sits at Georgia.',
      v_campus_id;
  end if;

  raise notice 'Andrew moved to The Academy GA as % (was %).', v_new_number, v_old_number;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect: Andrew at The Academy GA with a new number; Dante Neason still
-- holding 000010 at GA; the move recorded with both numbers; and his five
-- class sections unchanged, four Virtual and one HS.

select 'andrew now'::text as finding,
       s.first_name || ' ' || s.last_name as who,
       sc.name as campus,
       s.student_number as detail
  from public.students s
  join public.schools sc on sc.id = s.school_id
 where s.first_name = 'Andrew' and s.last_name = 'Ribeiro'

union all

select 'ga 000010 is still',
       s.first_name || ' ' || s.last_name,
       'The Academy GA',
       s.student_number
  from public.students s
  join public.schools sc on sc.id = s.school_id
 where sc.name = 'The Academy GA' and s.student_number = '000010'

union all

select 'move recorded',
       s.first_name || ' ' || s.last_name,
       f.name || ' -> ' || t.name,
       coalesce(m.from_student_number, '-') || ' -> ' || coalesce(m.to_student_number, '-')
  from public.student_campus_moves m
  join public.students s on s.id = m.student_id
  join public.schools f on f.id = m.from_school_id
  join public.schools t on t.id = m.to_school_id

union all

select 'class unchanged',
       s.first_name || ' ' || s.last_name,
       sc.name,
       c.name || ' / ' || cs.section_code
  from public.students s
  join public.student_enrollments se on se.student_id = s.id
  join public.course_sections cs on cs.id = se.course_section_id
  join public.courses c on c.id = cs.course_id
  join public.schools sc on sc.id = c.school_id
 where s.first_name = 'Andrew' and s.last_name = 'Ribeiro'
   and se.enrollment_status = 'enrolled'

order by 1, 4;

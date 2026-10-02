-- 463_the_fourteen_classes_a_teacher_may_log_2026_10_02.sql
--
-- The class list Jimmy settled on 2 October, and the two things that hang off
-- a class: what it pays, and who may log it.
--
-- ============================================================================
-- THE FOURTEEN, IN HIS WORDS AND HIS SPELLING
-- ============================================================================
--
--    1  Digit Lab - ms                      8  Entrepreneurship I
--    2  HS Real-World Math                  9  Life Lab I
--    3  Lit Lab                            10  Life Lab II
--    4  Earthology                         11  1:1 Tutoring Non-Structured Literacy
--    5  Real-World Math                    12  1:1 Tutoring Structured Literacy
--    6  Advanced Entrepreneurship          13  1:1 Tutoring Craig & Ivy
--    7  Entrepreneurship II                14  Structured Literacy
--
-- "these are the only classes that should be listed with these exact words.
--  do not change anything" - so the strings below are copied, not tidied.
-- "Digit Lab - ms" keeps its lower-case ms and its spaced hyphen. "Lit Lab"
-- and "Real-World Math" are two words and hyphenated where he hyphenated
-- them, which is NOT how the old rows were spelled.
--
-- ============================================================================
-- WHY THE RATE IS DATA AND NOT A PATTERN IN THE CODE
-- ============================================================================
--
-- The old model decided the Structured Literacy rate by looking at the course
-- name. That worked while there was one such class. It cannot survive this
-- list:
--
--    1:1 Tutoring Structured Literacy        pays 35.00
--    1:1 Tutoring Non-Structured Literacy    pays 20.00
--
-- One word apart, and any code that sniffs a name for "structured literacy"
-- pays the second one as though it were the first. So every course carries
-- its own figures here, and nothing anywhere reads a class name to decide
-- money.
--
--    the eleven                base 20.00, 5.00 for each student after the first
--    Structured Literacy       base 35.00, 5.00 after
--    1:1 Tutoring Structured   base 35.00, 5.00 after (a 1:1 never has a second)
--    1:1 Tutoring Craig & Ivy  a flat 30.00 a session - Jimmy, 2 October
--
-- ============================================================================
-- WHY GRANTS AND NOT A FLAG
-- ============================================================================
--
-- An earlier draft of this migration had one table answering one question:
-- may this person teach Structured Literacy. Within the hour the answer had
-- to cover a second restricted class and then a third belonging to one man,
-- and a fourth would have meant a fourth table.
--
-- So: a course is open to everybody unless it is marked restricted, and a
-- restricted course needs a row per teacher. Adding a restriction later is a
-- one-line update; adding a person is one row.
--
--    1:1 Tutoring Craig & Ivy          Craig Mann
--    1:1 Tutoring Structured Literacy  the seven below
--    Structured Literacy               the seven below
--
--    Mahogany Murphy · Marisa Vanella · Renee Tracewell · Holly Medlong
--    Jessica Price · Katie Vetere · Kim Hawkins
--
-- SEEDED BY EMAIL, NOT BY NAME. This repository carries both "Renne" and
-- "Renee" Tracewell in its own comments, and seeding on the wrong spelling
-- would have quietly left her out of her own subject.
--
-- ============================================================================
-- WHY THE COURSES HAVE NO CAMPUS
-- ============================================================================
--
-- Jimmy: "no campus unless i specify". courses.school_id is NOT NULL, so a
-- row has to live somewhere - but in the new model the campus that decides
-- whether money lands under AV or HS is on the CLASS ENTRY, chosen by the
-- teacher when she logs it, not on the course. So the school here is
-- bookkeeping and carries no meaning. A teacher logging an HS session files
-- under HS whatever this column says, and Craig's HS tutoring is not
-- mis-filed by a row living at Virtual.
--
-- NOTHING OLD IS TOUCHED. These are new rows beside the existing ones. The
-- old courses are archived and deleted separately, after this week's pay.
--
-- Safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- 1. The catalogue
-- ---------------------------------------------------------------------------

create table if not exists public.teacher_pay_courses (
  course_id            uuid primary key
    references public.courses(id) on delete cascade,

  -- What one class earns. Named in cents so nothing rounds on the way in.
  base_cents           integer not null check (base_cents >= 0),
  per_additional_cents integer not null default 500 check (per_additional_cents >= 0),

  -- True means a teacher needs a row in teacher_pay_course_grants to log it.
  restricted           boolean not null default false,

  -- The order Jimmy listed them in. A dropdown sorted alphabetically puts
  -- "1:1 Tutoring Craig & Ivy" above "Advanced Entrepreneurship", which is
  -- nobody's idea of a class list.
  sort_order           integer not null default 100,

  created_at           timestamptz not null default now()
);

comment on table public.teacher_pay_courses is
  'The classes a teacher may log on their week, what each one pays, and '
  'whether it needs a grant. A course absent from this table is not offered '
  'at all - which is how the old classes disappear from the picker without '
  'anything being deleted.';

create table if not exists public.teacher_pay_course_grants (
  employee_id        uuid not null references public.employees(id) on delete cascade,
  course_id          uuid not null references public.teacher_pay_courses(course_id) on delete cascade,
  granted_by_user_id uuid references public.users(id) on delete set null,
  granted_at         timestamptz not null default now(),
  note               text,
  primary key (employee_id, course_id)
);

comment on table public.teacher_pay_course_grants is
  'Who may log a restricted class. No row means no, which is the safe '
  'direction: a missing grant costs a question, a spare one costs money.';

alter table public.teacher_pay_courses       enable row level security;
alter table public.teacher_pay_course_grants enable row level security;

/* Everybody signed in may read the catalogue - a teacher has to be able to
   see the list to choose from it, and a price list is not a secret. Only
   Jimmy and Danni may change it. */
drop policy if exists teacher_pay_courses_read  on public.teacher_pay_courses;
drop policy if exists teacher_pay_courses_write on public.teacher_pay_courses;

create policy teacher_pay_courses_read
  on public.teacher_pay_courses for select
  using (auth.uid() is not null);

create policy teacher_pay_courses_write
  on public.teacher_pay_courses for all
  using (public.may_administer_teacher_pay())
  with check (public.may_administer_teacher_pay());

/* A teacher may see her OWN grants, because the picker has to explain itself.
   She may not see who else holds what. */
drop policy if exists teacher_pay_course_grants_read  on public.teacher_pay_course_grants;
drop policy if exists teacher_pay_course_grants_write on public.teacher_pay_course_grants;

create policy teacher_pay_course_grants_read
  on public.teacher_pay_course_grants for select
  using (
    public.may_read_all_teacher_pay()
    or (public.current_employee_id() is not null
        and employee_id = public.current_employee_id())
  );

create policy teacher_pay_course_grants_write
  on public.teacher_pay_course_grants for all
  using (public.may_administer_teacher_pay())
  with check (public.may_administer_teacher_pay());

-- ---------------------------------------------------------------------------
-- 2. The fourteen courses themselves
-- ---------------------------------------------------------------------------

do $$
declare
  v_school uuid;
  v_course uuid;
  r record;
begin
  select id into v_school from public.schools where name = 'The Academy Virtual' limit 1;
  if v_school is null then
    raise exception 'No school named The Academy Virtual - cannot file the course rows.';
  end if;

  for r in
    select * from (values
      ( 1, 'Digit Lab - ms',                       'JAG-DIGIT-LAB-MS',   2000, 500, false),
      ( 2, 'HS Real-World Math',                   'JAG-HS-RW-MATH',     2000, 500, false),
      ( 3, 'Lit Lab',                              'JAG-LIT-LAB',        2000, 500, false),
      ( 4, 'Earthology',                           'JAG-EARTHOLOGY',     2000, 500, false),
      ( 5, 'Real-World Math',                      'JAG-RW-MATH',        2000, 500, false),
      ( 6, 'Advanced Entrepreneurship',            'JAG-ENT-ADV',        2000, 500, false),
      ( 7, 'Entrepreneurship II',                  'JAG-ENT-2',          2000, 500, false),
      ( 8, 'Entrepreneurship I',                   'JAG-ENT-1',          2000, 500, false),
      ( 9, 'Life Lab I',                           'JAG-LIFE-LAB-1',     2000, 500, false),
      (10, 'Life Lab II',                          'JAG-LIFE-LAB-2',     2000, 500, false),
      (11, '1:1 Tutoring Non-Structured Literacy', 'JAG-TUT-NONSL',      2000, 500, false),
      (12, '1:1 Tutoring Structured Literacy',     'JAG-TUT-SL',         3500, 500, true),
      (13, '1:1 Tutoring Craig & Ivy',             'JAG-TUT-CRAIG-IVY',  3000,   0, true),
      (14, 'Structured Literacy',                  'JAG-STRUCT-LIT',     3500, 500, true)
    ) as t(pos, cname, ccode, base, per_add, restricted)
  loop
    /* By CODE, not by name. Two courses may legitimately share a name across
       schools - "Structured Literacy" already exists at four of them - and
       matching on the name would attach this catalogue to the old row. */
    select id into v_course
      from public.courses
     where school_id = v_school and code = r.ccode
     limit 1;

    if v_course is null then
      insert into public.courses (school_id, code, name, status)
      values (v_school, r.ccode, r.cname, 'active')
      returning id into v_course;
    else
      /* Re-run: keep the name exactly as Jimmy wrote it, in case a previous
         run or a person changed it. */
      update public.courses set name = r.cname, status = 'active', updated_at = now()
       where id = v_course;
    end if;

    insert into public.teacher_pay_courses
      (course_id, base_cents, per_additional_cents, restricted, sort_order)
    values (v_course, r.base, r.per_add, r.restricted, r.pos)
    on conflict (course_id) do update
      set base_cents           = excluded.base_cents,
          per_additional_cents = excluded.per_additional_cents,
          restricted           = excluded.restricted,
          sort_order           = excluded.sort_order;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Who may log the restricted three
-- ---------------------------------------------------------------------------

/* The seven, for both Structured Literacy and its 1:1 form. */
insert into public.teacher_pay_course_grants (employee_id, course_id, note)
select e.id, tpc.course_id, 'Jimmy, 2 October 2026'
  from public.employees e
  join public.users u on u.id = e.user_id
  join public.courses c
    on c.code in ('JAG-STRUCT-LIT', 'JAG-TUT-SL')
  join public.teacher_pay_courses tpc on tpc.course_id = c.id
 where e.employment_status = 'active'
   and lower(u.email) in (
         'mahogany.murphy@theacademyway.org',
         'marisa.vanella@theacademyvirtual.org',
         'renee.tracewell@theacademyhs.org',
         'holly.medlong@theacademyvirtual.org',
         'jessica.price@theacademyvirtual.org',
         'katie.vetere@theacademyvirtual.org',
         'kim.hawkins@theacademyvirtual.org'
       )
on conflict (employee_id, course_id) do nothing;

/* Craig, for his own. */
insert into public.teacher_pay_course_grants (employee_id, course_id, note)
select e.id, tpc.course_id, 'Jimmy, 2 October 2026 - Craig and Ivy only'
  from public.employees e
  join public.users u on u.id = e.user_id
  join public.courses c on c.code = 'JAG-TUT-CRAIG-IVY'
  join public.teacher_pay_courses tpc on tpc.course_id = c.id
 where e.employment_status = 'active'
   and lower(u.email) = 'craig.mann@theacademyhs.org'
on conflict (employee_id, course_id) do nothing;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Every class a teacher can now choose, what it pays, and who may log it.
--
-- EXPECT fourteen rows in Jimmy's order. Eleven should read "everybody".
-- Structured Literacy and 1:1 Tutoring Structured Literacy should each name
-- SEVEN people. 1:1 Tutoring Craig & Ivy should name Craig Mann and nobody
-- else.
--
-- A restricted row reading "NOBODY - nobody can log this" is a grant that did
-- not match: an address has changed, or a record is inactive. That is the row
-- that matters, and it is spelled out rather than left as a count.

select tpc.sort_order                                       as no,
       c.name                                               as class,
       ('$' || to_char(tpc.base_cents / 100.0, 'FM990D00')) as first_student,
       case when tpc.per_additional_cents = 0 then 'flat - no per-student amount'
            else '$' || to_char(tpc.per_additional_cents / 100.0, 'FM990D00')
                      || ' each after' end                  as additional,
       case
         when not tpc.restricted then 'everybody'
         else coalesce((
           select string_agg(
                    coalesce(
                      nullif(trim(to_jsonb(p) ->> 'display_name'), ''),
                      nullif(trim(to_jsonb(u) ->> 'display_name'), ''),
                      nullif(trim(to_jsonb(u) ->> 'email'), ''),
                      left(g.employee_id::text, 8)),
                    ', ' order by 1)
             from public.teacher_pay_course_grants g
             left join public.employees e on e.id = g.employee_id
             left join public.users u on u.id = e.user_id
             left join public.employee_profiles p on p.employee_id = e.id
            where g.course_id = tpc.course_id
         ), 'NOBODY - nobody can log this')
       end                                                  as who_may_log_it
  from public.teacher_pay_courses tpc
  join public.courses c on c.id = tpc.course_id
 order by tpc.sort_order;

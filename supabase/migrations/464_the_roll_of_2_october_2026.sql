-- 464_the_roll_of_2_october_2026.sql
--
-- Jimmy's roll, 2 October 2026. 78 children: FL 36 · GA 22 · HS 11 · AV 9.
-- "load up only these students."
--
-- WHAT THIS DOES
--
--   1. Every child on the roll exists and is active. Missing ones are
--      created at the school Jimmy put them at; existing ones are matched
--      and activated rather than duplicated.
--   2. Every student NOT on the roll is set to inactive. They vanish from the
--      teacher's grid - which is "only these students" - and nothing of
--      theirs is touched.
--
-- WHAT THIS DELIBERATELY DOES NOT DO: DELETE.
--
-- A course had sections under it. A child has enrolments, an admissions
-- record, guardians, a tuition plan, scholarship applications, a contract and
-- payments, and the foreign keys cascade. Removing a student row removes a
-- family's financial history in one statement, and there is no version of
-- that worth doing at three in the morning to save a dropdown from showing a
-- name nobody will click.
--
-- Inactive gets the same visible result and keeps the door open. The deletes
-- can be written in daylight, against a list, after somebody has looked at
-- what money is attached.
--
-- IT DOES NOT MOVE AN EXISTING CHILD BETWEEN SCHOOLS, and that is a change
-- forced by the database rather than a preference. The first version of this
-- migration set school_id from the roll and Postgres refused it:
--
--   duplicate key value violates unique constraint
--   "idx_students_school_student_number"
--   Key (school_id, student_number)=(...FL..., 000012) already exists
--
-- Student numbers are unique WITHIN a school, so moving a child carries their
-- old number into a school where somebody already has it. Renumbering them to
-- fix that would quietly change an identifier the office may use on records,
-- forms and invoices, to save a label on a dropdown. Not at midnight, and not
-- without being asked.
--
-- So an existing child stays where they are, and the VERIFY block at the
-- bottom NAMES every child whose school of record disagrees with the roll.
-- That list is the decision, made in daylight, with the numbers visible.
--
-- MATCHING IGNORES case, spaces, punctuation and anything in brackets, so
-- "James (LJ) Dublis" finds an existing "James Dublis", "Mackenzie " with its
-- trailing space matches "Mackenzie", and "Israel (Josiah) KCooks" matches
-- "Israel KCooks". Without that, this migration would create seventy-eight
-- duplicates of children who are already here.
--
-- SCHOOL OF RECORD. AV is The Academy Virtual. The roll's four codes are the
-- only ones accepted; anything else stops the migration rather than filing a
-- child somewhere arbitrary.
--
-- Safe to re-run.

begin;

/* NOT dropped on commit: the VERIFY block below reads it. It disappears
   with the session either way. */
create temporary table _roll (first_name text, last_name text, school text);

insert into _roll (first_name, last_name, school) values
         ('Isla', 'Fitzgerald', 'FL'),
         ('Maximillian', 'Salas', 'FL'),
         ('Drew', 'Ross', 'FL'),
         ('Jayden', 'Byrd', 'FL'),
         ('Mackenzie', 'Morris', 'FL'),
         ('Bella Ann', 'Waldroup', 'FL'),
         ('Penny', 'Shropshire', 'FL'),
         ('Alexander', 'Pobuda', 'FL'),
         ('Bentley', 'Treu', 'FL'),
         ('Brady', 'Treu', 'FL'),
         ('Charlee', 'Treu', 'FL'),
         ('Caly', 'Padilla', 'FL'),
         ('Christian', 'Rubio', 'FL'),
         ('Alexandra', 'Rubio', 'FL'),
         ('Savannah', 'Nemeroff', 'FL'),
         ('Emmaleigh', 'Karns', 'FL'),
         ('Abigail', 'Karns', 'FL'),
         ('Maddison', 'Francillon', 'FL'),
         ('Izrael', 'Gathers', 'FL'),
         ('Zion', 'Gathers', 'FL'),
         ('Fabianys', 'Torres', 'FL'),
         ('Damari', 'Oliver', 'FL'),
         ('Damian', 'Oliver', 'FL'),
         ('Kainoa', 'Skinner', 'FL'),
         ('Naomi', 'Hayes', 'FL'),
         ('Zechariah', 'Bowers', 'FL'),
         ('Harper', 'Bowers', 'FL'),
         ('Lincoln', 'Nieves', 'FL'),
         ('Huston', 'Bowden', 'FL'),
         ('Brooke', 'Bowden', 'FL'),
         ('James (LJ)', 'Dublis', 'FL'),
         ('Will', 'Sifonte', 'FL'),
         ('Cade', 'Macklin', 'FL'),
         ('Adaya', 'Ward', 'FL'),
         ('Connor', 'Ramos', 'FL'),
         ('Gianna', 'Mora', 'FL'),
         ('Israel (Josiah)', 'KCooks', 'GA'),
         ('Maddox', 'Mixon', 'GA'),
         ('Andrew', 'Ribeiro', 'GA'),
         ('Madison', 'Corley', 'GA'),
         ('Parker', 'Brittelle', 'GA'),
         ('Dante', 'Naeson', 'GA'),
         ('Santiago', 'Alvarado', 'GA'),
         ('Nash', 'Wilson', 'GA'),
         ('Talia', 'Johnson', 'GA'),
         ('Kaelyn', 'Maddox', 'GA'),
         ('Tijan', 'Senghore', 'GA'),
         ('Abigail', 'McHoney', 'GA'),
         ('Gabrielle', 'Ingram', 'GA'),
         ('Liam', 'Bryant', 'GA'),
         ('Zaid', 'Brady', 'GA'),
         ('Hailey', 'Rosser', 'GA'),
         ('Emiliano', 'Perez', 'GA'),
         ('Oliver', 'Winiacrzyk', 'GA'),
         ('Mason', 'Goolsby', 'GA'),
         ('Rylan', 'Jex', 'GA'),
         ('Braydon', 'Mccaskill', 'GA'),
         ('Nolan', 'Riley', 'GA'),
         ('Areli', 'Romero', 'AV'),
         ('Jelina', 'Augustave', 'AV'),
         ('Louie', 'Putman', 'AV'),
         ('Amira', 'Hayles', 'AV'),
         ('Gabriela', 'Gindel', 'AV'),
         ('Ivy', 'Ash', 'AV'),
         ('Olsen', 'Peters', 'AV'),
         ('Carwyn', 'Williams', 'AV'),
         ('Wren', 'Peters', 'AV'),
         ('Samuel (John)', 'Dobson', 'HS'),
         ('Izabella', 'McCallum', 'HS'),
         ('Claire', 'Meyers', 'HS'),
         ('Jacob', 'Stromlund', 'HS'),
         ('Darla', 'Sewell', 'HS'),
         ('Cate', 'Crath', 'HS'),
         ('Fiona', 'Dasaro', 'HS'),
         ('Cole', 'Heffernan', 'HS'),
         ('Ava', 'Caplan', 'HS'),
         ('Carter', 'Fromm', 'HS'),
         ('Kody', 'Sanders', 'HS');

/* The same normalisation the reconciliation query used. */
create temporary view _roll_keyed as
  select trim(first_name) as first_name,
         trim(last_name)  as last_name,
         school,
         regexp_replace(
           regexp_replace(lower(first_name || last_name), '\(.*?\)', '', 'g'),
           '[^a-z0-9]', '', 'g') as key
    from _roll;

create temporary view _students_keyed as
  select s.id,
         regexp_replace(
           regexp_replace(lower(coalesce(s.first_name,'') || coalesce(s.last_name,'')),
                          '\(.*?\)', '', 'g'),
           '[^a-z0-9]', '', 'g') as key
    from public.students s;

do $$
declare
  r record;
  v_school uuid;
  v_program text;
  v_existing uuid;
  v_created int := 0;
  v_updated int := 0;
begin
  for r in select * from _roll_keyed loop

    select id into v_school from public.schools
     where name = case r.school
                    when 'FL' then 'The Academy FL'
                    when 'GA' then 'The Academy GA'
                    when 'HS' then 'The Academy HS'
                    when 'AV' then 'The Academy Virtual'
                  end
     limit 1;

    if v_school is null then
      raise exception 'No school for code "%" (child: % %)', r.school, r.first_name, r.last_name;
    end if;

    v_program := case r.school
                   when 'FL' then 'academy_fl_campus'
                   when 'GA' then 'academy_ga_campus'
                   when 'HS' then 'academy_hs'
                   when 'AV' then 'academy_virtual'
                 end;

    select id into v_existing from _students_keyed where key = r.key limit 1;

    if v_existing is null then
      insert into public.students
        (school_id, first_name, last_name, status, enrollment_status, program)
      values
        (v_school, r.first_name, r.last_name, 'active', 'enrolled', v_program);
      v_created := v_created + 1;
    else
      /* status only. school_id is deliberately left alone - see the header. */
      update public.students
         set status = 'active',
             updated_at = now()
       where id = v_existing;
      v_updated := v_updated + 1;
    end if;
  end loop;

  raise notice 'Roll applied: % created, % matched and set active.', v_created, v_updated;
end $$;

/* Everybody else off the grid. Not deleted - inactive. */
update public.students s
   set status = 'inactive',
       updated_at = now()
 where coalesce(s.status, '') <> 'inactive'
   and not exists (
     select 1 from _roll_keyed r
      where r.key = regexp_replace(
              regexp_replace(lower(coalesce(s.first_name,'') || coalesce(s.last_name,'')),
                             '\(.*?\)', '', 'g'),
              '[^a-z0-9]', '', 'g')
   );

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT 78 active children: FL 36, GA 22, HS 11, AV 9 - and that is exactly
-- what a teacher will see on the grid, grouped the same way.
--
-- The inactive count is everyone who was here before and is not on the roll.
-- They still exist, with everything attached to them, and can be brought back
-- by setting status to active.

select 'COUNT'                                                      as block,
       case when coalesce(s.status,'') = 'active' then 'on the roll — active'
            else 'not on the roll — inactive, nothing deleted' end    as detail,
       coalesce(sc.name, '(no school)')                               as school,
       count(*)::text                                                 as children
  from public.students s
  left join public.schools sc on sc.id = s.school_id
 group by 1, 2, 3

union all

/*
 * THE ONE THAT NEEDS A DECISION. A child on the roll whose school of record
 * in the database is not the school Jimmy put them at. They are active and a
 * teacher can schedule them; they will simply appear in the wrong group on
 * the grid, and file against the wrong campus in any report that reads the
 * school.
 *
 * Moving them needs their student number resolved first. Nothing here does
 * it.
 */
select 'SCHOOL OF RECORD DISAGREES WITH THE ROLL',
       trim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,'')),
       'roll says ' || r.school || ', database says ' || coalesce(sc.name, '(none)'),
       coalesce(to_jsonb(s) ->> 'student_number', '(no number)')
  from public.students s
  left join public.schools sc on sc.id = s.school_id
  join _roll_keyed r
    on r.key = regexp_replace(
         regexp_replace(lower(coalesce(s.first_name,'') || coalesce(s.last_name,'')),
                        '\(.*?\)', '', 'g'),
         '[^a-z0-9]', '', 'g')
 where coalesce(sc.name, '') <> case r.school
                                  when 'FL' then 'The Academy FL'
                                  when 'GA' then 'The Academy GA'
                                  when 'HS' then 'The Academy HS'
                                  when 'AV' then 'The Academy Virtual'
                                end

 order by block, detail, school;

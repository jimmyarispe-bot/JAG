-- 452_fl_and_ga_get_the_four_classes_2026_09_29.sql
--
-- The Academy FL and The Academy GA get LitLab, DigitLab, Earthology and
-- Structured Literacy, with the descriptions Jimmy wrote.
--
-- WHY THIS EXISTS. Reading the course table on 29 September turned up
-- something nobody had asked about: FL and GA have NO COURSES AT ALL. Every
-- one of the twelve rows belongs to The Academy Virtual or The Academy HS.
-- Jimmy confirmed the four run at all three campuses, so the two campuses
-- that were supposed to teach them had nothing to teach them with.
--
-- ADDITIVE ONLY. This migration inserts eight rows and changes nothing that
-- exists. No course is renamed, no description is overwritten, nothing is
-- deleted. Which campus owns Life Lab, Earth Lab and Real World Math is
-- deliberately NOT settled here: Jimmy is redesigning how classes are
-- assigned, scheduled, recorded and paid, and those rows move with that work.
--
-- LitLab AND DigitLab, NOT "Lit Lab" AND "Digit Lab". Jimmy, 29 September:
-- keep the closed-up spelling. That is also what Virtual's existing rows say,
-- so all three campuses now name these classes identically and there is no
-- transitional disagreement to remember.
--
-- NO SECTIONS. A course with no sections has no schedule, no teacher and no
-- children - exactly what these are until somebody schedules them. That is
-- the honest state, and it is why `status` is left at its default 'active'
-- rather than being invented as something else: the course exists and may be
-- scheduled.
--
-- THE CLASS NAME INSIDE THE COPY IS NORMALISED. Jimmy's document writes both
-- "LitLab" and "Lit Lab" in the same description. The class is LitLab, so
-- the body says LitLab throughout. Nothing else in his wording is changed.
--
-- Safe to re-run: keyed on (school_id, code), which 047 made unique. A second
-- run refreshes the name and description and leaves everything else alone.

begin;

do $$
declare
  v_fl uuid;
  v_ga uuid;
  v_rows integer;
begin
  select id into v_fl from public.schools where lower(trim(name)) = 'the academy fl';
  select id into v_ga from public.schools where lower(trim(name)) = 'the academy ga';

  -- Fail loudly. A campus that cannot be found must not be silently skipped:
  -- "Success" with four rows instead of eight is the shape of bug this
  -- codebase keeps finding.
  if v_fl is null then
    raise exception '452: no school named "The Academy FL". Nothing inserted.';
  end if;
  if v_ga is null then
    raise exception '452: no school named "The Academy GA". Nothing inserted.';
  end if;

  insert into public.courses (school_id, code, name, description)
  select s.school_id, c.code, c.name, c.description
    from (values (v_fl), (v_ga)) as s(school_id)
    cross join (values

      ('LITLAB', 'LitLab',
       'Where stories come to life and every voice matters.' || chr(10) || chr(10) ||
       'LitLab is an exciting, multisensory learning adventure where reading, writing, and hands-on creativity combine! Our lower elementary students learn reading, writing and grammar through interactive novel studies. They dive into fantastic books, and engage in project-based and multisensory learning, using visual, auditory, and tactile activities that build core skills to be successful readers and writers.' || chr(10) || chr(10) ||
       'Our middle school students engage in an innovative theme-based curriculum called Language LIVE! This is designed to develop core skills in phonics, vocabulary, comprehension, and grammar through structured lessons and hands-on practice - while always relating it back to real world application. Learners collaborate together and utilize a variety of digital platforms to brainstorm big ideas!' || chr(10) || chr(10) ||
       'In LitLab every student gets the chance to learn in ways that match their strengths, engage all their senses, and share the stories that matter to them!'),

      ('DIGITLAB', 'DigitLab',
       'Where numbers come to life and math makes real-world sense.' || chr(10) || chr(10) ||
       'DigitLab is more than a traditional math class - it''s a place to explore real-world ideas, build financial confidence, and connect numbers to everyday life through hands-on, and digital learning. In all of our DigitLab classes we utilize the curriculum Zearn. We cover foundational math concepts - like arithmetic, fractions, geometry, and financial literacy. However, our instruction is unique as we teach in a non-traditional way. We use a multisensory approach that engages visual, auditory, and tactile learners alike.' || chr(10) || chr(10) ||
       'Instead of memorizing formulas and completing repetitive worksheets, students apply what they learn directly to the real world through authentic applications. Whether budgeting for a project, analyzing real-life data, or solving interactive real-world challenges, every learner has an opportunity to shine.' || chr(10) || chr(10) ||
       'At DigitLab, we believe every student can master practical math skills and financial literacy through innovative, hands-on learning and digital tools, ultimately gaining the practical knowledge needed to thrive in the real world.'),

      ('EARTHOLOGY', 'Earthology',
       'Exploring our planet, its people, and the amazing world we share.' || chr(10) || chr(10) ||
       'Earthology blends Earth and physical sciences, geography, history, culture, environmental studies, and global citizenship into one exciting learning adventure. Learners investigate how the Earth works from the inside out by exploring dynamic weather systems, force and motion, forms of energy, human anatomy, and how physical environments have shaped cultures and civilizations throughout history.' || chr(10) || chr(10) ||
       'Through virtual field trips, interactive investigations, mapping activities, projects, research, experiments, and real-world challenges, students become explorers, scientists, historians, and problem-solvers. This class is engaging and accessible, using visuals, discussions, investigations, experiments, projects with hands-on and virtual activities.' || chr(10) || chr(10) ||
       'Earthology inspires curiosity, critical thinking, and a lifelong love of discovering how our world works and our place within it.'),

      ('STRUCTLIT', 'Structured Literacy',
       'An encouraging, structured approach to reading success.' || chr(10) || chr(10) ||
       'Every great reader begins by understanding how language works. Implemented by Certified Dyslexia Practitioners, our Structured Literacy program utilizes the Wilson Reading System to deliver explicit, systematic, and multisensory instruction that unlocks the core building blocks of reading and spelling.' || chr(10) || chr(10) ||
       'Through hands-on learning, students discover the patterns, sounds, and structures that make reading click. Lessons are carefully sequenced and personalized, ensuring each learner builds a strong foundation while progressing at a pace that supports lasting success.' || chr(10) || chr(10) ||
       'Designed specifically for students with dyslexia and language-based learning differences, Structured Literacy empowers students to become confident, capable readers and writers. At The Academy Way, we don''t just teach students to read - we help them discover the confidence, resilience, and joy that comes from being a motivated and successful reader!')

    ) as c(code, name, description)
  on conflict (school_id, code) do update
    set name        = excluded.name,
        description = excluded.description,
        updated_at  = now();

  get diagnostics v_rows = row_count;
  raise notice '452: % course rows written across The Academy FL and The Academy GA.', v_rows;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect eight rows: four at FL, four at GA, each with a description and no
-- sections. The names must read exactly LitLab and DigitLab, matching the
-- rows Virtual already has.

select s.name as campus,
       c.name as course,
       c.code,
       length(c.description) as description_chars,
       (select count(*) from public.course_sections cs where cs.course_id = c.id) as sections
  from public.courses c
  join public.schools s on s.id = c.school_id
 where lower(trim(s.name)) in ('the academy fl', 'the academy ga')
 order by s.name, c.name;

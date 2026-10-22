-- 583 - Jimmy, 21 Oct 2026 ~10 PM ET: first reusable Listening survey in The JAG OS.
-- "Stakeholder Listening Survey" — from the Marco Island Charter Middle School (MICMS)
-- Principal-interview survey (Jul 2026), wording generalized + Student Achievement added.
-- Owner: The Academy Way Network of Schools. Created as a DRAFT version (not published,
-- no campaign, nothing sent). Marco Island answers are NOT imported (Jimmy, 21 Oct).
-- Safe to re-run: skips if the survey already exists.
-- RUN 21 Oct ~10:15 PM ET (by Claude, Jimmy approved). Dry run passed first.

do $$
declare
  v_org     uuid;
  v_inst    uuid;
  v_ver     uuid;
  v_q       uuid;
  v_order   int := 0;
  r         record;
  v_prio    text;
  v_prios   text[] := array[
    'Student Achievement', 'School Culture', 'Teacher Support', 'Student Safety',
    'Communication', 'Family Engagement', 'Fiscal Stewardship', 'Innovation'
  ];
begin
  select id into v_org
    from public.org_organizations
   where name = 'The Academy Way Network of Schools'
   limit 1;
  if v_org is null then
    raise exception 'Organization "The Academy Way Network of Schools" not found';
  end if;

  if exists (
    select 1 from public.listening_instruments
     where organization_id = v_org
       and title = 'Stakeholder Listening Survey'
       and archived_at is null
  ) then
    raise notice 'Stakeholder Listening Survey already exists — skipping';
    return;
  end if;

  insert into public.listening_instruments (organization_id, title, description, metadata)
  values (
    v_org,
    'Stakeholder Listening Survey',
    'Listen first: what stakeholders value, worry about, and hope a school leader accomplishes. Reusable for any school.',
    jsonb_build_object('origin', 'micms_principal_interview_2026_07', 'template', true)
  )
  returning id into v_inst;

  insert into public.listening_instrument_versions (organization_id, instrument_id, version_no, status, metadata)
  values (
    v_org, v_inst, 1, 'draft',
    jsonb_build_object('sections', jsonb_build_array(
      jsonb_build_object('id', 'about',      'title', 'About you',  'description', '', 'displayOrder', 1),
      jsonb_build_object('id', 'school',     'title', 'Our school', 'description', '', 'displayOrder', 2),
      jsonb_build_object('id', 'priorities', 'title', 'Priorities', 'description', 'Rate the importance of each area, 1 (lowest priority) to 5 (highest priority).', 'displayOrder', 3),
      jsonb_build_object('id', 'leadership', 'title', 'Leadership', 'description', '', 'displayOrder', 4)
    ))
  )
  returning id into v_ver;

  -- 1. Role
  v_order := v_order + 1;
  insert into public.listening_questions
    (organization_id, instrument_version_id, question_key, question_type, prompt, required, display_order, config)
  values (v_org, v_ver, 'role', 'single_choice',
          'What is your primary role in the school community?', true, v_order,
          jsonb_build_object('sectionId', 'about', 'sectionTitle', 'About you'))
  returning id into v_q;
  insert into public.listening_question_options (organization_id, question_id, option_key, label, display_order)
  values (v_org, v_q, 'board', 'Board', 1),
         (v_org, v_q, 'teacher', 'Teacher', 2),
         (v_org, v_q, 'staff', 'Staff', 3),
         (v_org, v_q, 'parent', 'Parent', 4),
         (v_org, v_q, 'student', 'Student', 5),
         (v_org, v_q, 'community', 'Community', 6);

  -- 2-5. Our school
  for r in select * from (values
      ('strength',     'What is our school''s greatest strength?'),
      ('opportunity',  'What is our school''s biggest opportunity?'),
      ('never_change', 'What should never change about our school?'),
      ('change_first', 'If you were our school''s leader tomorrow, what would you change first?')
    ) as t(qkey, prompt)
  loop
    v_order := v_order + 1;
    insert into public.listening_questions
      (organization_id, instrument_version_id, question_key, question_type, prompt, required, display_order, config)
    values (v_org, v_ver, r.qkey, 'short_text', r.prompt, true, v_order,
            jsonb_build_object('sectionId', 'school', 'sectionTitle', 'Our school'));
  end loop;

  -- 6-13. Priority ratings (1-5)
  foreach v_prio in array v_prios
  loop
    v_order := v_order + 1;
    insert into public.listening_questions
      (organization_id, instrument_version_id, question_key, question_type, prompt, required, display_order, config)
    values (v_org, v_ver, 'priority_' || lower(replace(v_prio, ' ', '_')), 'likert', v_prio, true, v_order,
            jsonb_build_object(
              'sectionId', 'priorities', 'sectionTitle', 'Priorities',
              'sectionDescription', 'Rate the importance of each area, 1 (lowest priority) to 5 (highest priority).',
              'likertLowLabel', 'Lowest priority', 'likertHighLabel', 'Highest priority'))
    returning id into v_q;
    insert into public.listening_question_options (organization_id, question_id, option_key, label, display_order, value_numeric)
    select v_org, v_q, n::text, n::text, n, n from generate_series(1, 5) as n;
  end loop;

  -- 14-17. Leadership
  for r in select * from (values
      ('leader_hopes', 'What do you hope I accomplish as your school leader?', true),
      ('concerns',     'What concerns you most about your school?', true),
      ('advice',       'What advice would you give me as the leader of your school?', true),
      ('anything_else','Is there anything else you would like to share?', false)
    ) as t(qkey, prompt, req)
  loop
    v_order := v_order + 1;
    insert into public.listening_questions
      (organization_id, instrument_version_id, question_key, question_type, prompt, required, display_order, config)
    values (v_org, v_ver, r.qkey, 'long_text', r.prompt, r.req, v_order,
            jsonb_build_object('sectionId', 'leadership', 'sectionTitle', 'Leadership'));
  end loop;

  raise notice 'Created Stakeholder Listening Survey: instrument %, draft version %, % questions', v_inst, v_ver, v_order;
end $$;

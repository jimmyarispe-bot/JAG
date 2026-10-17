-- ============================================================================
-- 562  TWO MORE CORE CLASSES AT THE HIGH SCHOOL
--      16 October 2026
-- ============================================================================
--
-- WHAT JIMMY ASKED FOR, VERBATIM
--
--   "in the application, not inquiry, when the academy hs is selected; add
--    check boxes for parents to answer this question (not required) - Do you
--    want your student to attend one or both of these additional core classes
--    that we offer: Structured Literacy - Math"
--
-- Three conditions, and each one is a separate mechanism in this form:
--
--   "in the application, not inquiry"  -> phase: "application"
--   "when the academy hs is selected"  -> visibleWhen school_id = HS
--   "check boxes"                      -> type: "multiselect"
--   "(not required)"                   -> required: false
--
-- ── WHERE IT GOES ──────────────────────────────────────────────────────────
--
-- Section `hs_detail`, titled "The Academy HS". That section already declares
-- phase "application" and already carries
--
--   visibleWhen { all: [ school_id eq a1000000-...-0003 ] }
--
-- so the section alone would satisfy two of the three conditions. The question
-- declares both of them again anyway, which is the pattern every other
-- campus-scoped question in this form follows (program_hs, hs_student_email)
-- and is what migration 549 had to go back and add to four questions that
-- relied on something else to scope them. A question that states its own
-- campus cannot be moved into the wrong section by accident.
--
-- IT IS FIRST IN THE SECTION, not last. The renderer draws a section's
-- questions in `questionKeys` order, not by the `order` field - see
-- InterestFormRenderer.tsx, which maps section.questionKeys and looks each key
-- up. The other five questions in this section are background about the child
-- (years of high school, suspensions, why this school, anything else). This
-- one is about what the student would enrol in, so it is asked before the
-- narrative rather than after "Is there anything else we should know".
--
-- ── THE LABEL IS HIS SENTENCE, UNCHANGED ───────────────────────────────────
--
-- The question's label is the sentence he wrote up to the colon. The two
-- things after the colon - Structured Literacy, Math - are the two check
-- boxes. Nothing is reworded and nothing is added.
--
-- THE OPTION VALUES ARE THE LABELS, not snake_case codes. The case file's
-- answers panel (components/admissions/case/sections/InterestFormSection.tsx
-- line 44-46) prints an array answer by joining the stored VALUES with a
-- comma. extractQuestionLabels collects objects carrying `key` + `label`;
-- options carry `value` + `label`, so option labels are never resolved there.
-- A value of "structured_literacy" would reach Heather as
-- "structured_literacy". program_hs already stores its values this way for
-- the same reason.
--
-- ── NO CODE CHANGE, AND THAT IS CHECKED, NOT ASSUMED ───────────────────────
--
-- A multiselect with plain `options` renders as a checkbox group
-- (InterestFormRenderer.tsx line 533), is validated generically against its
-- own options (definition.ts line 526), is stored one row per question_key in
-- admissions_interest_answers, and is shown to staff by looping the
-- definition. `grep -rn hs_why_attend src/` returns NOTHING: no question in
-- this section is named anywhere in the codebase. This is a definition
-- change, start to finish.
--
-- ── A NEW VERSION, NOT AN EDIT ─────────────────────────────────────────────
--
-- Same as 549: published versions are immutable (versioning.ts
-- assertPublishedVersionImmutable), and a unique partial index allows exactly
-- one published version per form. So 40 is archived first, 41 takes the empty
-- slot, and the form header is repointed - all in one transaction.
--
-- content_hash is computed over the jsonb text, as 549 did and for the reason
-- 549 gave: the builder's hash is over JavaScript's serialisation, which jsonb
-- does not preserve, and nothing reads the column back.
--
-- ============================================================================

begin;

-- ── THE GUARD, BEFORE ──────────────────────────────────────────────────────

do $$
declare
  n_forms   integer;
  n_pub     integer;
  n_qs      integer;
  n_dupe    integer;
  n_section integer;
  n_keys    integer;
  n_hs      integer;
begin
  select count(*) into n_forms from public.admissions_interest_forms;
  if n_forms <> 1 then
    raise exception 'Refusing: expected exactly 1 interest form, found %.', n_forms;
  end if;

  select count(*) into n_pub
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id
  where v.id = f.published_version_id and v.version_number = 40;
  if n_pub <> 1 then
    raise exception 'Refusing: version 40 is not the published version. This file was written against it.';
  end if;

  select jsonb_array_length(v.definition -> 'questions') into n_qs
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id
  where v.id = f.published_version_id;
  if n_qs <> 71 then
    raise exception 'Refusing: expected 71 questions in the published form, found %.', n_qs;
  end if;

  -- Nobody has added this question already, by hand or by an earlier run.
  select count(*) into n_dupe
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id,
       lateral jsonb_array_elements(v.definition -> 'questions') q
  where v.id = f.published_version_id
    and q ->> 'key' = 'hs_additional_core_classes';
  if n_dupe <> 0 then
    raise exception 'Refusing: hs_additional_core_classes already exists in the published form.';
  end if;

  -- The section this lands in is the one this file was written against:
  -- application phase, HS campus, and the five questions it has today.
  select count(*) into n_section
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id,
       lateral jsonb_array_elements(v.definition -> 'sections') s
  where v.id = f.published_version_id
    and s ->> 'key' = 'hs_detail'
    and s ->> 'title' = 'The Academy HS'
    and s ->> 'phase' = 'application'
    and exists (
      select 1 from jsonb_array_elements(s -> 'visibleWhen' -> 'all') c
      where c ->> 'path' = 'school_id'
        and c ->> 'op' = 'eq'
        and c ->> 'value' = 'a1000000-0000-4000-8000-000000000003'
    );
  if n_section <> 1 then
    raise exception 'Refusing: the hs_detail section is not what this file expects.';
  end if;

  select jsonb_array_length(s -> 'questionKeys') into n_keys
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id,
       lateral jsonb_array_elements(v.definition -> 'sections') s
  where v.id = f.published_version_id and s ->> 'key' = 'hs_detail';
  if n_keys <> 5 then
    raise exception 'Refusing: hs_detail holds % questions, expected 5.', n_keys;
  end if;

  -- And the campus is the campus this question is named for.
  select count(*) into n_hs from public.schools
  where id = 'a1000000-0000-4000-8000-000000000003' and name = 'The Academy HS';
  if n_hs <> 1 then
    raise exception 'Refusing: the HS campus id is not what this file expects.';
  end if;
end $$;

-- ── 40 IS RETIRED FIRST ────────────────────────────────────────────────────
--
-- idx_admissions_interest_form_one_published allows one published version per
-- form. Inserting 41 as published while 40 still holds the slot makes two and
-- the index refuses, rolling the whole transaction back. Both statements are
-- in this transaction, so no reader ever sees a form with no published
-- version, and published_version_id still points at 40 while the insert below
-- reads it.

update public.admissions_interest_form_versions v
   set lifecycle = 'archived'
 where v.version_number = 40
   and v.lifecycle = 'published'
   and v.form_id = (select id from public.admissions_interest_forms);

-- ── THE NEW VERSION ────────────────────────────────────────────────────────

with published as (
  select v.id, v.form_id, v.organization_id, v.schema_version, v.definition,
         v.version_number
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id
  where v.id = f.published_version_id
),
patched_questions as (
  select p.id as source_version_id,
         jsonb_agg(q order by ord) || jsonb_build_array(
           jsonb_build_object(
             'key',      'hs_additional_core_classes',
             'type',     'multiselect',
             'label',    'Do you want your student to attend one or both of these additional core classes that we offer:',
             'order',    50,
             'phase',    'application',
             'required', false,
             'options',  jsonb_build_array(
                           jsonb_build_object('label', 'Structured Literacy', 'value', 'Structured Literacy'),
                           jsonb_build_object('label', 'Math',                'value', 'Math')
                         ),
             'visibleWhen', jsonb_build_object(
                              'all', jsonb_build_array(jsonb_build_object(
                                'op', 'eq',
                                'path', 'school_id',
                                'value', 'a1000000-0000-4000-8000-000000000003'
                              ))
                            ),
             'systemBinding', null
           )
         ) as questions
  from published p,
       lateral jsonb_array_elements(p.definition -> 'questions') with ordinality as t(q, ord)
  group by p.id
),
patched_sections as (
  select p.id as source_version_id,
         jsonb_agg(
           case
             when s ->> 'key' = 'hs_detail'
               then jsonb_set(
                 s, '{questionKeys}',
                 jsonb_build_array('hs_additional_core_classes') || (s -> 'questionKeys')
               )
             else s
           end
           order by ord
         ) as sections
  from published p,
       lateral jsonb_array_elements(p.definition -> 'sections') with ordinality as t(s, ord)
  group by p.id
),
new_definition as (
  select p.form_id, p.organization_id, p.schema_version, p.version_number,
         jsonb_set(
           jsonb_set(p.definition, '{questions}', pq.questions),
           '{sections}', ps.sections
         ) as definition
  from published p
  join patched_questions pq on pq.source_version_id = p.id
  join patched_sections  ps on ps.source_version_id = p.id
)
insert into public.admissions_interest_form_versions
  (form_id, organization_id, version_number, lifecycle, schema_version,
   definition, content_hash, published_at, created_by)
select form_id,
       organization_id,
       version_number + 1,
       'published',
       schema_version,
       definition,
       encode(digest(definition::text, 'sha256'), 'hex'),
       now(),
       null
from new_definition;

-- ── POINT THE FORM AT IT ───────────────────────────────────────────────────

update public.admissions_interest_forms f
   set published_version_id = (
         select v.id from public.admissions_interest_form_versions v
         where v.form_id = f.id
         order by v.version_number desc
         limit 1
       ),
       updated_at = now();

-- ── THE GUARD, AFTER ───────────────────────────────────────────────────────

do $$
declare
  pub_ver    integer;
  n_qs       integer;
  n_good     integer;
  n_first    integer;
  n_keys     integer;
  n_changed  integer;
  n_sections integer;
begin
  select v.version_number into pub_ver
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id
  where v.id = f.published_version_id;
  if pub_ver <> 41 then
    raise exception 'Refusing: version 41 is not published, % is.', pub_ver;
  end if;

  select jsonb_array_length(v.definition -> 'questions') into n_qs
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id
  where v.id = f.published_version_id;
  if n_qs <> 72 then
    raise exception 'Refusing: the new version has % questions, not 72.', n_qs;
  end if;

  -- The question itself: every one of Jimmy's four conditions, read back.
  select count(*) into n_good
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id,
       lateral jsonb_array_elements(v.definition -> 'questions') q
  where v.id = f.published_version_id
    and q ->> 'key' = 'hs_additional_core_classes'
    and q ->> 'type' = 'multiselect'
    and q ->> 'phase' = 'application'
    and (q ->> 'required')::boolean = false
    and q ->> 'label' = 'Do you want your student to attend one or both of these additional core classes that we offer:'
    and jsonb_array_length(q -> 'options') = 2
    and q -> 'options' -> 0 ->> 'value' = 'Structured Literacy'
    and q -> 'options' -> 1 ->> 'value' = 'Math'
    and exists (
      select 1 from jsonb_array_elements(q -> 'visibleWhen' -> 'all') c
      where c ->> 'path' = 'school_id'
        and c ->> 'op' = 'eq'
        and c ->> 'value' = 'a1000000-0000-4000-8000-000000000003'
    );
  if n_good <> 1 then
    raise exception 'Refusing: the new question is not exactly as specified.';
  end if;

  -- It is in the HS section, and it is first.
  select jsonb_array_length(s -> 'questionKeys') into n_keys
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id,
       lateral jsonb_array_elements(v.definition -> 'sections') s
  where v.id = f.published_version_id and s ->> 'key' = 'hs_detail';
  if n_keys <> 6 then
    raise exception 'Refusing: hs_detail now holds % questions, expected 6.', n_keys;
  end if;

  select count(*) into n_first
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id,
       lateral jsonb_array_elements(v.definition -> 'sections') s
  where v.id = f.published_version_id
    and s ->> 'key' = 'hs_detail'
    and s -> 'questionKeys' ->> 0 = 'hs_additional_core_classes';
  if n_first <> 1 then
    raise exception 'Refusing: the new question is not first in the hs_detail section.';
  end if;

  -- NOTHING ELSE MOVED. Every question that was in 40 is byte-identical in 41.
  select count(*) into n_changed
  from (
    select q ->> 'key' as k, q as new_q
    from public.admissions_interest_form_versions v
    join public.admissions_interest_forms f on f.id = v.form_id,
         lateral jsonb_array_elements(v.definition -> 'questions') q
    where v.id = f.published_version_id
  ) n
  join (
    select q ->> 'key' as k, q as old_q
    from public.admissions_interest_form_versions v,
         lateral jsonb_array_elements(v.definition -> 'questions') q
    where v.version_number = 40
  ) o on o.k = n.k
  where n.new_q is distinct from o.old_q;
  if n_changed <> 0 then
    raise exception 'Refusing: % question(s) changed that should not have.', n_changed;
  end if;

  -- And every section other than hs_detail is byte-identical too.
  select count(*) into n_sections
  from (
    select s ->> 'key' as k, s as new_s
    from public.admissions_interest_form_versions v
    join public.admissions_interest_forms f on f.id = v.form_id,
         lateral jsonb_array_elements(v.definition -> 'sections') s
    where v.id = f.published_version_id
  ) n
  join (
    select s ->> 'key' as k, s as old_s
    from public.admissions_interest_form_versions v,
         lateral jsonb_array_elements(v.definition -> 'sections') s
    where v.version_number = 40
  ) o on o.k = n.k
  where n.k <> 'hs_detail'
    and n.new_s is distinct from o.old_s;
  if n_sections <> 0 then
    raise exception 'Refusing: % section(s) changed that should not have.', n_sections;
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- The question, exactly as it now sits in the published form.
select jsonb_pretty(q) as new_question
from public.admissions_interest_form_versions v
join public.admissions_interest_forms f on f.id = v.form_id,
     lateral jsonb_array_elements(v.definition -> 'questions') q
where v.id = f.published_version_id
  and q ->> 'key' = 'hs_additional_core_classes';

-- The section it lives in, and the order the parent will read.
select s ->> 'title' as section, s -> 'questionKeys' as question_order
from public.admissions_interest_form_versions v
join public.admissions_interest_forms f on f.id = v.form_id,
     lateral jsonb_array_elements(v.definition -> 'sections') s
where v.id = f.published_version_id and s ->> 'key' = 'hs_detail';

-- The version history. Expect 41 published, 40 archived.
select v.version_number, v.lifecycle, (v.id = f.published_version_id) as is_published,
       v.published_at
from public.admissions_interest_form_versions v
join public.admissions_interest_forms f on f.id = v.form_id
order by v.version_number desc
limit 5;

-- 472_two_sentences_off_the_ethnicity_questions_2026_10_02.sql
--
-- Jimmy, 2 October 2026, looking at Callum's live application: "delete help
-- text under Hispanic field and delete You may leave this blank from both
-- highlighted areas."
--
--   hispanic_or_latino   "Florida and Georgia ask us for this. You may leave
--                        it blank."                    -> removed entirely
--
--   race                 "Check all that apply. You may leave this blank."
--                                                      -> "Check all that apply."
--
-- WHY THE SECOND SENTENCE WAS WRONG ANYWAY. Both questions carry a required
-- marker on the live form. Telling a parent a starred field may be left blank
-- is the form arguing with itself, and the parent who believes it gets stopped
-- at submit with no idea why.
--
-- THE HELP TEXT UNDER HISPANIC GOES COMPLETELY, not just its last sentence.
-- "Florida and Georgia ask us for this" explains the school's reporting
-- obligation to somebody who did not ask about it, in the middle of a form
-- about their child.
--
-- replace() RATHER THAN A FLAT OVERWRITE on the race question - the same
-- choice 454 made - so a help text somebody has since edited keeps the edit
-- and loses only the sentence. The Hispanic one is set to empty because the
-- whole thing goes.
--
-- A FORM VERSION IS PUBLISHED, NOT EDITED IN PLACE. The live definition is
-- immutable: the current version is archived and a new one published, exactly
-- as 454 did. A family part way through an application keeps the version they
-- started on.
--
-- Safe to re-run. If the live form already says this, nothing is published and
-- it says so.

begin;

do $$
declare
  v_form_id      uuid;
  v_org_id       uuid;
  v_published_id uuid;
  v_def          jsonb;
  v_before       text;
  v_after        text;
  v_hash         text;
  v_next_number  integer;

  v_race_old text := 'Check all that apply. You may leave this blank.';
  v_race_new text := 'Check all that apply.';
begin
  select f.id, f.organization_id, f.published_version_id, v.definition
    into v_form_id, v_org_id, v_published_id, v_def
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
   limit 1;

  if v_form_id is null or v_def is null then
    raise exception
      'No published interest form found. The public form is serving nothing, '
      'which is a bigger problem than this migration - fix that first.';
  end if;

  v_before := v_def::text;

  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case q ->> 'key'
                      when 'hispanic_or_latino' then
                        jsonb_set(q, '{helpText}', to_jsonb(''::text))
                      when 'race' then
                        jsonb_set(q, '{helpText}', to_jsonb(
                          replace(coalesce(q ->> 'helpText',''), v_race_old, v_race_new)))
                      else q
                    end
                    order by ord)
             from jsonb_array_elements(v_def -> 'questions') with ordinality as t(q, ord)))
    into v_def;

  v_after := v_def::text;

  if v_after = v_before then
    raise notice '472: the live form already says this. No version published.';
    return;
  end if;

  v_hash := encode(sha256(convert_to(v_after, 'UTF8')), 'hex');

  select coalesce(max(version_number), 0) + 1 into v_next_number
    from public.admissions_interest_form_versions where form_id = v_form_id;

  update public.admissions_interest_form_versions
     set lifecycle = 'archived' where id = v_published_id;

  insert into public.admissions_interest_form_versions (
    form_id, organization_id, version_number, lifecycle,
    schema_version, definition, content_hash, published_at
  )
  values (
    v_form_id, v_org_id, v_next_number, 'published',
    coalesce(v_def ->> 'schemaVersion', 'interest_form.v1'), v_def, v_hash, now()
  )
  returning id into v_published_id;

  update public.admissions_interest_forms
     set published_version_id = v_published_id, draft_version_id = null, updated_at = now()
   where id = v_form_id;

  raise notice '472: published v% - two sentences gone.', v_next_number;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT two rows:
--   hispanic_or_latino   help_text  (empty)
--   race                 help_text  Check all that apply.
--
-- Any remaining "You may leave" means the sentence on the live form differs
-- from what this file searched for, and nothing was changed on that question.

select q.value ->> 'key'                                   as question_key,
       coalesce(nullif(q.value ->> 'helpText', ''), '(empty)') as help_text
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id
  cross join lateral jsonb_array_elements(v.definition -> 'questions') q
 where q.value ->> 'key' in ('hispanic_or_latino', 'race')
 order by 1;

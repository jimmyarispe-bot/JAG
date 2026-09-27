-- 441_three_programmes_already_had_a_code_2026_09_27.sql
--
-- Merge three duplicate catalogue rows that migration 438 created, into the
-- codes the rest of the platform already uses.
--
-- WHAT HAPPENED, plainly. 438 seeded 89 programmes without first reading what
-- `funding_program_catalog` already held. Four of its codes happened to match
-- rows migration 309 had seeded - az_esa, ar_efa, ga_promise, nc_esa_plus -
-- so those upserted cleanly and are correct. Three did not match, and became
-- a second row for a programme that already had one:
--
--   ga_sns      is Georgia Special Needs. The platform calls it `ga_esa`. The
--               code is a poor name and migration 325 even guessed it was
--               junk, but 066 seeded it as "Georgia Special Needs
--               Scholarship" and 309 says so explicitly. It is load-bearing:
--               `scholarship_awards.program_code` and
--               `funder_disbursements` both point at it by code.
--
--   ga_qee_sso  is the Georgia Qualified Education Expense credit. The
--               platform already records the family-facing end of it as
--               `ga_goal`, added by 254 for Braydon's second programme, and
--               the interest form's `ga_scholarships` question already offers
--               `ga_goal` as a value.
--
--   tx_tefa     is the Texas ESA. 309 seeded it as `tx_esa`.
--
-- THE COST OF LEAVING IT. Two rows for one programme is two places for the
-- same money to be counted and two answers to "how many students on Georgia
-- Special Needs". Texas is worse than the other two, because Texas is the one
-- of the three a parent is actually offered: without this merge the form
-- would hand parents `tx_tefa` while every disbursement record says `tx_esa`,
-- and nothing would ever join.
--
-- WHAT THIS DOES. For each pair, the research 438 gathered is copied onto the
-- row that already existed, anything pointing at the duplicate is repointed,
-- and the duplicate is deleted. Nothing can be pointing at them yet - they
-- were created minutes ago and no screen writes to this table - but the
-- repointing runs anyway, because "nothing can be pointing at it" is exactly
-- the assumption that produced this migration.
--
-- THE LIVE FORM TOO. 438 and 439 are both corrected on disk, so re-running
-- either will not bring the duplicates back. But v28 was published from the
-- uncorrected 439 and its Texas choice is `tx_tefa`, a code this migration is
-- about to delete. So step 4 rewrites any option value in the PUBLISHED
-- definition that names a merged code, and publishes a new version if it
-- changed anything. If 439 was run after the correction there is nothing to
-- rewrite and no version is published. Either way the form and the catalogue
-- agree when this finishes, which is the only thing that matters.
--
-- Safe to re-run: it does nothing once the duplicates are gone.

do $$
declare
  pair   record;
  v_old  uuid;
  v_new  uuid;
  v_n    int;
begin
  for pair in
    select * from (values
      ('ga_sns',     'ga_esa'),
      ('ga_qee_sso', 'ga_goal'),
      ('tx_tefa',    'tx_esa')
    ) as t(dup, keep)
  loop
    select id into v_new from public.funding_program_catalog where program_code = pair.dup;
    select id into v_old from public.funding_program_catalog where program_code = pair.keep;

    if v_new is null then
      raise notice '% : already merged.', pair.dup;
      continue;
    end if;

    if v_old is null then
      -- the survivor is missing, so the duplicate simply takes its name
      update public.funding_program_catalog
         set program_code = pair.keep, updated_at = now()
       where id = v_new;
      raise notice '% : renamed to % (no existing row to merge into).', pair.dup, pair.keep;
      continue;
    end if;

    -- 1. the research moves to the row that already existed
    update public.funding_program_catalog k
       set program_name            = d.program_name,
           state_code              = d.state_code,
           funding_agency          = d.funding_agency,
           maximum_award           = d.maximum_award,
           payment_schedule        = d.payment_schedule,
           renewal_rules           = d.renewal_rules,
           required_documents      = d.required_documents,
           website                 = d.website,
           is_active               = d.is_active,
           program_type            = d.program_type,
           program_status          = d.program_status,
           family_identifier_label = d.family_identifier_label,
           family_selectable       = d.family_selectable,
           documents_note          = d.documents_note,
           research_confidence     = d.research_confidence,
           updated_at              = now()
      from public.funding_program_catalog d
     where k.id = v_old and d.id = v_new;

    -- 2. anything pointing at the duplicate now points at the survivor
    update public.state_funding_verifications
       set funding_program_id = v_old where funding_program_id = v_new;
    get diagnostics v_n = row_count;
    if v_n > 0 then raise notice '% : repointed % state_funding_verifications.', pair.dup, v_n; end if;

    update public.ssis_student_funding_records
       set funding_program_id = v_old where funding_program_id = v_new;
    get diagnostics v_n = row_count;
    if v_n > 0 then raise notice '% : repointed % ssis_student_funding_records.', pair.dup, v_n; end if;

    update public.scholarship_awards
       set program_code = pair.keep where program_code = pair.dup;
    get diagnostics v_n = row_count;
    if v_n > 0 then raise notice '% : repointed % scholarship_awards.', pair.dup, v_n; end if;

    begin
      execute format(
        'update public.funder_disbursements set program_code = %L where program_code = %L',
        pair.keep, pair.dup);
      get diagnostics v_n = row_count;
      if v_n > 0 then raise notice '% : repointed % funder_disbursements.', pair.dup, v_n; end if;
    exception when undefined_column or undefined_table then
      null;
    end;

    -- 3. the duplicate goes
    delete from public.funding_program_catalog where id = v_new;
    raise notice '% merged into % and deleted.', pair.dup, pair.keep;
  end loop;
end $$;

-- ── 4. the live form learns the surviving codes ──────────────────────────────

do $$
declare
  v_form_id      uuid;
  v_org_id       uuid;
  v_published_id uuid;
  v_def          jsonb;
  v_before       text;
  v_after        text;
  v_next_number  int;
  v_hash         text;
  v_new_id       uuid;
begin
  select id, organization_id, published_version_id
    into v_form_id, v_org_id, v_published_id
    from public.admissions_interest_forms;

  select definition into v_def
    from public.admissions_interest_form_versions
   where id = v_published_id;

  if v_def is null then
    raise notice 'No published form. Nothing to rewrite.';
    return;
  end if;

  /* Rewritten on the whole question, not the whole definition, and only on
     the one question that carries these codes. A blind text replace across
     the definition would also hit any label or help text that happens to
     contain the string, and a code is a short string. */
  v_before := v_def::text;

  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case when q->>'key' = 'state_funding_program'
                         then jsonb_set(q, '{options}', (
                                select jsonb_agg(
                                         case o->>'value'
                                           when 'ga_sns'     then jsonb_set(o, '{value}', '"ga_esa"')
                                           when 'ga_qee_sso' then jsonb_set(o, '{value}', '"ga_goal"')
                                           when 'tx_tefa'    then jsonb_set(o, '{value}', '"tx_esa"')
                                           else o
                                         end
                                         order by o_ord)
                                  from jsonb_array_elements(q->'options')
                                       with ordinality as ot(o, o_ord)))
                         else q end
                    order by ord)
             from jsonb_array_elements(v_def->'questions') with ordinality as t(q, ord)))
    into v_def;

  /* The same three codes can also appear inside a visibleWhen `in` list - the
     document questions are gated on the programme. Those are rewritten on the
     rule text of the state_funding questions only, where a bare code cannot
     collide with prose. */
  select jsonb_set(v_def, '{questions}', (
           select jsonb_agg(
                    case when q->>'key' like 'state_funding%' and q ? 'visibleWhen'
                         then jsonb_set(q, '{visibleWhen}',
                                replace(replace(replace((q->'visibleWhen')::text,
                                  '"ga_sns"', '"ga_esa"'),
                                  '"ga_qee_sso"', '"ga_goal"'),
                                  '"tx_tefa"', '"tx_esa"')::jsonb)
                         else q end
                    order by ord)
             from jsonb_array_elements(v_def->'questions') with ordinality as t(q, ord)))
    into v_def;

  v_after := v_def::text;

  if v_after = v_before then
    raise notice 'The live form already uses the surviving codes. No version published.';
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
    coalesce(v_def->>'schemaVersion', 'interest_form.v1'), v_def, v_hash, now()
  )
  returning id into v_new_id;

  update public.admissions_interest_forms
     set published_version_id = v_new_id, draft_version_id = null, updated_at = now()
   where id = v_form_id;

  raise notice 'Published v% with the merged codes.', v_next_number;
end $$;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- 'duplicate left'   : MUST BE EMPTY.
-- 'total'            : 91.
-- 'offered to family': 63.
-- 'the three merged' : ga_esa, ga_goal and tx_esa, each now carrying the
--                      researched name and type. tx_esa must read
--                      family_selectable = true; the other two false, because
--                      a Georgia family answers the Georgia section.
-- 'georgia and texas': every GA and TX row, so a fourth Georgia row nobody
--                      expected shows up here rather than in a report in June.
-- 'form still stale'  : MUST BE EMPTY. Any option the live form offers that no
--                      longer exists in the catalogue.
-- 'texas option'      : tx_esa.

select 'duplicate left'::text as finding, program_code as detail, program_name as detail_2
  from public.funding_program_catalog
 where program_code in ('ga_sns', 'ga_qee_sso', 'tx_tefa')
union all
select 'total', count(*)::text, '' from public.funding_program_catalog
union all
select 'offered to family', count(*)::text, ''
  from public.funding_program_catalog where family_selectable
union all
select 'the three merged', program_code,
       program_type || ' / ' || program_status || ' / offered=' || family_selectable::text
  from public.funding_program_catalog
 where program_code in ('ga_esa', 'ga_goal', 'tx_esa')
union all
select 'georgia and texas', program_code, left(program_name, 70)
  from public.funding_program_catalog
 where state_code in ('GA', 'TX')
union all
select 'form still stale', o->>'value', left(o->>'label', 60)
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id,
       jsonb_array_elements(v.definition->'questions') q,
       jsonb_array_elements(q->'options') o
 where q->>'key' = 'state_funding_program'
   and o->>'value' <> 'not_listed'
   and not exists (select 1 from public.funding_program_catalog c
                    where c.program_code = o->>'value' and c.family_selectable)
union all
select 'texas option', o->>'value', left(o->>'label', 60)
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v on v.id = f.published_version_id,
       jsonb_array_elements(v.definition->'questions') q,
       jsonb_array_elements(q->'options') o
 where q->>'key' = 'state_funding_program'
   and (o->'visibleWhen')::text like '%texas%'
order by 1, 2;

-- 439_a_family_from_any_state_can_name_their_scholarship_2026_09_27.sql
--
-- Version 28. A family resident in any state can tell us which state program
-- pays, how much, and hand over the documents that state expects the school
-- to hold.
--
-- Jimmy, 27 September 2026:
--
--   "now we need to ensure that we are always capturing the necessary
--    information from families living in other states who are also using
--    their state scholarships and depending on what information we need to
--    collect from them as required by their states (if any)."
--
--   "build it now based on the research you do for every single state we
--    aren't already collecting scholarships from."
--
-- WHAT A FAMILY SEES. Nothing new, unless they are a legal resident of a
-- state that is neither Georgia nor Florida. Then one new section asks
-- whether they are using state money; if they say yes, it asks which program,
-- how much, the award number if their state issues one, and the award letter.
-- The program list is their state's programs and no one else's - 63 programs
-- across 32 states, each option carrying an option-level rule naming that
-- state. A family in a state with no program still sees the question and can
-- answer no, or pick "My state's program is not on this list" and name it.
--
-- THREE THINGS THIS GETS RIGHT THAT A GENERIC FORM GETS WRONG.
--
--   1. Most states publish no award number a family can quote. Of the 63
--      programs, only a handful do - Oklahoma's Enrollment Verification
--      Number, Indiana's Student Test Number, Nevada's AAA ID, Ohio's
--      EdChoice Request Form, Wisconsin's SNSP application, DC's School
--      Placement Form, Maryland's and West Virginia's award letters. So the
--      award-number field is OPTIONAL. Requiring it would have been a wall in
--      front of most of the country, which is the same mistake version 5
--      fixed for Florida.
--
--   2. The extra documents are gated on the PROGRAM, not on the state, and
--      only where the research found the state genuinely expects the school
--      to hold them: an IEP or evaluation for the disability programs, proof
--      of residency for Ohio, Wisconsin, Indiana and Arizona, a birth
--      certificate for Ohio and Indiana's Choice, a 1040 for the
--      income-tested ones, and a sending-district authorization for town
--      tuitioning, which has no award letter at all.
--
--   3. Option VALUES are `program_code` in `funding_program_catalog`, the
--      convention migration 325 set for Florida. An answer maps to a
--      catalogue row exactly, so reporting does not string-match a label.
--
-- THE RESIDENCY QUESTION GROWS. `student_residency_state` had three choices:
-- Georgia, Florida, another state. It now carries all fifty states and the
-- District of Columbia, with "Another country, or none of these" last. The
-- values `georgia`, `florida` and `other` are unchanged, so every rule
-- migration 436 wrote and every answer already recorded still means exactly
-- what it meant.
--
-- WHAT THIS DOES NOT DO. It does not retire the generic "I/we have a
-- scholarship from our state" question that the HS and Virtual sections each
-- carry. Until that happens an out-of-state family is asked about their
-- scholarship twice, in two different places. Migration 440 retires it, and
-- it is a separate file because it removes something already live.
--
-- Safe to re-run: it exits without writing if `state_funding_using` exists.

do $$
declare
  v_form_id      uuid;
  v_org_id       uuid;
  v_published_id uuid;
  v_def          jsonb;
  v_payload      jsonb := $payload${"section": {"key": "state_funding", "title": "State scholarship, voucher or education savings account", "description": "Every state runs its own program with its own rules. These questions are the ones the student's state of legal residence actually requires a school to hold.", "questionKeys": ["state_funding_using", "state_funding_program", "state_funding_program_other", "state_funding_award_amount", "state_funding_identifier", "state_funding_award_letter", "state_funding_disability_document", "state_funding_residency_proof", "state_funding_birth_certificate", "state_funding_income_document", "state_funding_town_authorisation"]}, "questions": [{"key": "state_funding_using", "type": "select", "required": true, "label": "Will the student use a scholarship, voucher, or education savings account from the state where the student is a legal resident?", "helpText": "State money, not a scholarship from The Academy Way. Answer no if the family is paying privately or is not sure yet - nothing here is a commitment.", "options": [{"value": "yes", "label": "Yes"}, {"value": "no", "label": "No"}]}, {"key": "state_funding_program", "type": "select", "required": true, "visibleWhen": {"all": [{"op": "eq", "path": "state_funding_using", "value": "yes"}]}, "label": "Which program?", "helpText": "Only the programs offered by the student's state of legal residence are listed.", "options": [{"value": "ak_correspondence", "label": "Alaska Statewide Correspondence School Student Allotments", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "alaska"}]}}, {"value": "al_choose", "label": "CHOOSE Act Education Savings Account (Creating Hope and Opportunity for Our Students' Education Act of 2024)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "alabama"}]}}, {"value": "al_esp_sgo", "label": "Education Scholarship Program (Alabama Accountability Act - Scholarship Granting Organizations)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "alabama"}]}}, {"value": "ar_efa", "label": "Arkansas Children's Educational Freedom Account (EFA) Program (LEARNS Act)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "arkansas"}]}}, {"value": "az_sto_switcher", "label": "\"Switcher\" (Overflow / PLUS) Individual Income Tax Credit Scholarship Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "arizona"}]}}, {"value": "az_esa", "label": "Empowerment Scholarship Account (ESA) Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "arizona"}]}}, {"value": "az_sto_lexies_law", "label": "Lexie's Law for Disabled and Displaced Students Tax Credit Scholarship Program (Disabled/Displaced Corporate Credit)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "arizona"}]}}, {"value": "az_sto_lowincome_corp", "label": "Low-Income Corporate Income Tax Credit Scholarship Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "arizona"}]}}, {"value": "az_sto_original", "label": "Original Individual Income Tax Credit Scholarship Program (Certified School Tuition Organizations)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "arizona"}]}}, {"value": "dc_osp", "label": "DC Opportunity Scholarship Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "district_of_columbia"}]}}, {"value": "ia_sto", "label": "School Tuition Organization Tax Credit", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "iowa"}]}}, {"value": "ia_esa", "label": "Students First Education Savings Accounts (Iowa ESA)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "iowa"}]}}, {"value": "id_pctc", "label": "Idaho Parental Choice Tax Credit", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "idaho"}]}}, {"value": "in_choice", "label": "Choice Scholarship Program (Indiana school voucher)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "indiana"}]}}, {"value": "in_esa", "label": "Indiana Education Scholarship Account (INESA / Indiana ESA)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "indiana"}]}}, {"value": "in_sgo", "label": "School Scholarship Tax Credit Program (SGO Scholarships)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "indiana"}]}}, {"value": "ks_lisp", "label": "Kansas Tax Credit for Low Income Students Scholarship Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "kansas"}]}}, {"value": "la_gator", "label": "LA GATOR Scholarship Program (Louisiana Giving All True Opportunity to Rise)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "louisiana"}]}}, {"value": "la_tdc", "label": "Tuition Donation Credit Program (formerly Tuition Donation Rebate Program)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "louisiana"}]}}, {"value": "md_boost", "label": "Broadening Options and Opportunities for Students Today (BOOST)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "maryland"}]}}, {"value": "me_town", "label": "Maine Town Tuitioning Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "maine"}]}}, {"value": "mo_moscholars", "label": "MOScholars Missouri Empowerment Scholarship Accounts Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "missouri"}]}}, {"value": "ms_dyslexia", "label": "Dyslexia Therapy Scholarship for Students with Dyslexia Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "mississippi"}]}}, {"value": "ms_esa", "label": "Education Scholarship Account (ESA) Program - Equal Opportunity for Students with Special Needs Act", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "mississippi"}]}}, {"value": "ms_nate_rogers", "label": "Nate Rogers Scholarship for Students with Disabilities (Speech-Language Therapy Scholarship)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "mississippi"}]}}, {"value": "mt_esa_sn", "label": "Montana Special Needs Equal Opportunity Education Savings Account Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "montana"}]}}, {"value": "mt_tcs", "label": "Montana Tax Credit Scholarship Program, Tax Credits for Contributions to Student Scholarship Organizations", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "montana"}]}}, {"value": "nc_esa_plus", "label": "Education Student Accounts (ESA+)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "north_carolina"}]}}, {"value": "nc_opportunity", "label": "Opportunity Scholarship", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "north_carolina"}]}}, {"value": "nh_efa", "label": "Education Freedom Account Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "new_hampshire"}]}}, {"value": "nh_etc", "label": "Education Tax Credit Scholarship Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "new_hampshire"}]}}, {"value": "nh_town", "label": "New Hampshire Town Tuitioning Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "new_hampshire"}]}}, {"value": "nv_ecsp", "label": "Nevada Educational Choice Scholarship Program, Opportunity Scholarship", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "nevada"}]}}, {"value": "oh_autism", "label": "Autism Scholarship Program (ASP)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "ohio"}]}}, {"value": "oh_cleveland", "label": "Cleveland Scholarship and Tutoring Program (Cleveland Scholarship)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "ohio"}]}}, {"value": "oh_edchoice_expansion", "label": "EdChoice Expansion Scholarship (income-based EdChoice)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "ohio"}]}}, {"value": "oh_edchoice", "label": "Educational Choice Scholarship Program (EdChoice \"Traditional\" / performance-based)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "ohio"}]}}, {"value": "oh_jpsn", "label": "Jon Peterson Special Needs Scholarship Program (JPSN)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "ohio"}]}}, {"value": "oh_sgo", "label": "Scholarship Donation Credit (Ohio SGO tax-credit scholarships)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "ohio"}]}}, {"value": "ok_lnh", "label": "Lindsey Nicole Henry Scholarship for Students with Disabilities", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "oklahoma"}]}}, {"value": "ok_eoes", "label": "Oklahoma Equal Opportunity Education Scholarship", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "oklahoma"}]}}, {"value": "ok_pctc", "label": "Oklahoma Parental Choice Tax Credit", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "oklahoma"}]}}, {"value": "pa_eitc", "label": "Educational Improvement Tax Credit Program - Scholarship Organizations", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "pennsylvania"}]}}, {"value": "pa_ostc", "label": "Opportunity Scholarship Tax Credit Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "pennsylvania"}]}}, {"value": "ri_sgo", "label": "Tax Credits for Contributions to Scholarship Organizations", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "rhode_island"}]}}, {"value": "sc_estf", "label": "Education Scholarship Trust Fund", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "south_carolina"}]}}, {"value": "sc_ecenc", "label": "Educational Credit for Exceptional Needs Children Fund", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "south_carolina"}]}}, {"value": "sc_ecenc_refundable", "label": "Refundable Educational Credit for Exceptional Needs Children", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "south_carolina"}]}}, {"value": "sd_partners_in_education", "label": "South Dakota Partners in Education Tax Credit Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "south_dakota"}]}}, {"value": "tn_efs", "label": "Education Freedom Scholarship", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "tennessee"}]}}, {"value": "tn_esa_pilot", "label": "Education Savings Account Pilot Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "tennessee"}]}}, {"value": "tn_iea", "label": "Individualized Education Account Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "tennessee"}]}}, {"value": "tx_esa", "label": "Texas Education Freedom Accounts", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "texas"}]}}, {"value": "ut_carson_smith_opp", "label": "Carson Smith Opportunity Scholarship", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "utah"}]}}, {"value": "ut_fits_all", "label": "Utah Fits All Scholarship Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "utah"}]}}, {"value": "va_eistc", "label": "Education Improvement Scholarships Tax Credits Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "virginia"}]}}, {"value": "vt_town", "label": "Vermont Town Tuitioning Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "vermont"}]}}, {"value": "wi_mpcp", "label": "Milwaukee Parental Choice Program (MPCP)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "wisconsin"}]}}, {"value": "wi_rpcp", "label": "Racine Parental Choice Program (RPCP)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "wisconsin"}]}}, {"value": "wi_snsp", "label": "Special Needs Scholarship Program (SNSP)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "wisconsin"}]}}, {"value": "wi_wpcp", "label": "Wisconsin Parental Choice Program (WPCP - statewide)", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "wisconsin"}]}}, {"value": "wv_hope", "label": "Hope Scholarship Program", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "west_virginia"}]}}, {"value": "wy_steamboat", "label": "Steamboat Legacy Scholarship Act Education Savings Account", "visibleWhen": {"all": [{"op": "eq", "path": "student_residency_state", "value": "wyoming"}]}}, {"value": "not_listed", "label": "My state's program is not on this list"}]}, {"key": "state_funding_program_other", "type": "text", "required": true, "visibleWhen": {"all": [{"op": "eq", "path": "state_funding_program", "value": "not_listed"}]}, "label": "Name the program", "placeholder": "Program name, and the agency or organization that runs it"}, {"key": "state_funding_award_amount", "type": "currency", "required": true, "visibleWhen": {"all": [{"op": "eq", "path": "state_funding_using", "value": "yes"}]}, "label": "Award amount for the 2026-27 school year", "helpText": "The annual amount on the award letter. If the award is quarterly, enter the yearly total."}, {"key": "state_funding_identifier", "type": "text", "required": false, "visibleWhen": {"all": [{"op": "eq", "path": "state_funding_using", "value": "yes"}]}, "label": "State award or account number", "helpText": "Only some states issue one - Oklahoma's Enrollment Verification Number, Indiana's Student Test Number, Nevada's AAA ID. Most do not. Leave this blank if your award letter does not carry a number."}, {"key": "state_funding_award_letter", "type": "file", "required": true, "visibleWhen": {"all": [{"op": "eq", "path": "state_funding_using", "value": "yes"}]}, "label": "Upload the award or approval letter from your state program", "helpText": "A screenshot of the approval in your state's portal is fine if no letter was issued."}, {"key": "state_funding_disability_document", "type": "file", "required": true, "visibleWhen": {"all": [{"op": "in", "path": "state_funding_program", "value": ["az_esa", "az_sto_lexies_law", "in_esa", "ms_dyslexia", "ms_nate_rogers", "mt_esa_sn", "nc_esa_plus", "oh_autism", "oh_jpsn", "ok_lnh", "sc_ecenc", "sc_ecenc_refundable", "tn_iea", "wi_snsp"]}]}, "label": "Upload the student's current IEP, 504 plan, or evaluation report", "helpText": "This program is a disability program and the state requires the school to hold the plan or evaluation that qualified the student."}, {"key": "state_funding_residency_proof", "type": "file", "required": true, "visibleWhen": {"all": [{"op": "in", "path": "state_funding_program", "value": ["az_esa", "in_choice", "in_esa", "oh_cleveland", "oh_edchoice", "oh_edchoice_expansion", "wi_mpcp", "wi_rpcp", "wi_wpcp"]}]}, "label": "Upload proof of residency", "helpText": "A utility bill, lease, mortgage statement or deed showing the family's address. Ohio requires it to be dated within the last 90 days."}, {"key": "state_funding_birth_certificate", "type": "file", "required": true, "visibleWhen": {"all": [{"op": "in", "path": "state_funding_program", "value": ["in_choice", "oh_cleveland", "oh_edchoice", "oh_edchoice_expansion"]}]}, "label": "Upload a certified copy of the student's birth certificate"}, {"key": "state_funding_income_document", "type": "file", "required": true, "visibleWhen": {"all": [{"op": "in", "path": "state_funding_program", "value": ["ia_sto", "in_sgo", "md_boost", "oh_cleveland", "oh_edchoice_expansion", "oh_sgo", "va_eistc", "wi_mpcp", "wi_rpcp", "wi_wpcp"]}]}, "label": "Upload last year's federal tax return", "helpText": "This program is income-tested. Ohio accepts only a federal or state 1040."}, {"key": "state_funding_town_authorisation", "type": "file", "required": true, "visibleWhen": {"all": [{"op": "in", "path": "state_funding_program", "value": ["me_town", "nh_town", "vt_town"]}]}, "label": "Upload the sending district's tuition authorization", "helpText": "Town tuitioning has no award letter. The authorization from the sending district's superintendent or school board is the document that stands in its place."}], "residencyOptions": [{"value": "alabama", "label": "Alabama"}, {"value": "alaska", "label": "Alaska"}, {"value": "arizona", "label": "Arizona"}, {"value": "arkansas", "label": "Arkansas"}, {"value": "california", "label": "California"}, {"value": "colorado", "label": "Colorado"}, {"value": "connecticut", "label": "Connecticut"}, {"value": "delaware", "label": "Delaware"}, {"value": "district_of_columbia", "label": "District of Columbia"}, {"value": "florida", "label": "Florida"}, {"value": "georgia", "label": "Georgia"}, {"value": "hawaii", "label": "Hawaii"}, {"value": "idaho", "label": "Idaho"}, {"value": "illinois", "label": "Illinois"}, {"value": "indiana", "label": "Indiana"}, {"value": "iowa", "label": "Iowa"}, {"value": "kansas", "label": "Kansas"}, {"value": "kentucky", "label": "Kentucky"}, {"value": "louisiana", "label": "Louisiana"}, {"value": "maine", "label": "Maine"}, {"value": "maryland", "label": "Maryland"}, {"value": "massachusetts", "label": "Massachusetts"}, {"value": "michigan", "label": "Michigan"}, {"value": "minnesota", "label": "Minnesota"}, {"value": "mississippi", "label": "Mississippi"}, {"value": "missouri", "label": "Missouri"}, {"value": "montana", "label": "Montana"}, {"value": "nebraska", "label": "Nebraska"}, {"value": "nevada", "label": "Nevada"}, {"value": "new_hampshire", "label": "New Hampshire"}, {"value": "new_jersey", "label": "New Jersey"}, {"value": "new_mexico", "label": "New Mexico"}, {"value": "new_york", "label": "New York"}, {"value": "north_carolina", "label": "North Carolina"}, {"value": "north_dakota", "label": "North Dakota"}, {"value": "ohio", "label": "Ohio"}, {"value": "oklahoma", "label": "Oklahoma"}, {"value": "oregon", "label": "Oregon"}, {"value": "pennsylvania", "label": "Pennsylvania"}, {"value": "rhode_island", "label": "Rhode Island"}, {"value": "south_carolina", "label": "South Carolina"}, {"value": "south_dakota", "label": "South Dakota"}, {"value": "tennessee", "label": "Tennessee"}, {"value": "texas", "label": "Texas"}, {"value": "utah", "label": "Utah"}, {"value": "vermont", "label": "Vermont"}, {"value": "virginia", "label": "Virginia"}, {"value": "washington", "label": "Washington"}, {"value": "west_virginia", "label": "West Virginia"}, {"value": "wisconsin", "label": "Wisconsin"}, {"value": "wyoming", "label": "Wyoming"}, {"value": "other", "label": "Another country, or none of these"}]}$payload$::jsonb;
  v_max_q_order  int;
  v_max_s_order  int;
  v_questions    jsonb;
  v_sections     jsonb;
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

  if exists (
    select 1 from jsonb_array_elements(v_def->'questions') q
     where q->>'key' = 'state_funding_using'
  ) then
    raise notice 'The state funding section is already present. Nothing changed.';
    return;
  end if;

  if not exists (
    select 1 from jsonb_array_elements(v_def->'questions') q
     where q->>'key' = 'student_residency_state'
  ) then
    raise exception 'No student_residency_state question. Run 436 first.';
  end if;

  select max((q->>'order')::int) into v_max_q_order
    from jsonb_array_elements(v_def->'questions') q;
  select max((s->>'order')::int) into v_max_s_order
    from jsonb_array_elements(v_def->'sections') s;

  -- 1. the residency question learns the other forty-eight states
  select jsonb_agg(
           case when q->>'key' = 'student_residency_state'
                then jsonb_set(q, '{options}', v_payload->'residencyOptions')
                else q end
           order by ord)
    into v_questions
    from jsonb_array_elements(v_def->'questions') with ordinality as t(q, ord);

  -- 2. the new questions, ordered after everything already asked
  select v_questions || jsonb_agg(
           jsonb_set(qq, '{order}', to_jsonb(v_max_q_order + qord::int))
           order by qord)
    into v_questions
    from jsonb_array_elements(v_payload->'questions') with ordinality as t(qq, qord);

  -- 3. the section, shown to a resident of a state that is not Georgia, not
  --    Florida, and not "another country" - and only once they have answered
  --    the residency question at all
  select (v_def->'sections') || jsonb_build_array(
           (v_payload->'section')
           || jsonb_build_object('order', v_max_s_order + 1)
           || jsonb_build_object('visibleWhen', jsonb_build_object('all', jsonb_build_array(
                jsonb_build_object('op','exists','path','student_residency_state'),
                jsonb_build_object('op','neq','path','student_residency_state','value','georgia'),
                jsonb_build_object('op','neq','path','student_residency_state','value','florida'),
                jsonb_build_object('op','neq','path','student_residency_state','value','other')
              )))
         )
    into v_sections;

  v_def := jsonb_set(v_def, '{questions}', v_questions);
  v_def := jsonb_set(v_def, '{sections}', v_sections);

  v_hash := encode(sha256(convert_to(v_def::text, 'UTF8')), 'hex');

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

  raise notice 'Published v%.', v_next_number;
end $$;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- 'residency choices' : 51. Fifty states, the District of Columbia, and
--                       "Another country, or none of these".
-- 'section'           : one row, and its rule must name georgia, florida and
--                       other. If it does not, no out-of-state family will
--                       ever see this section and the form will look fine.
-- 'new question'      : ten or eleven rows, each with the rule that reveals it.
-- 'programs offered'  : 64 - the 63 catalogue programs plus "not on this list".
-- 'unmatched program' : MUST BE EMPTY. Every option value that is not a live
--                       family_selectable row in funding_program_catalog is a
--                       dropdown choice that reports to nothing.

with live as (
  select v.definition
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
)
select 'residency choices'::text as finding, ''::text as detail,
       jsonb_array_length(q->'options')::text as detail_2
  from live, jsonb_array_elements(definition->'questions') q
 where q->>'key' = 'student_residency_state'
union all
select 'section', s->>'title', (s->'visibleWhen')::text
  from live, jsonb_array_elements(definition->'sections') s
 where s->>'key' = 'state_funding'
union all
select 'new question', q->>'key', coalesce((q->'visibleWhen')::text, 'always')
  from live, jsonb_array_elements(definition->'questions') q
 where q->>'key' like 'state_funding%'
union all
select 'programs offered', '', jsonb_array_length(q->'options')::text
  from live, jsonb_array_elements(definition->'questions') q
 where q->>'key' = 'state_funding_program'
union all
select 'unmatched program', o->>'value', o->>'label'
  from live, jsonb_array_elements(definition->'questions') q,
       jsonb_array_elements(q->'options') o
 where q->>'key' = 'state_funding_program'
   and o->>'value' <> 'not_listed'
   and not exists (
     select 1 from public.funding_program_catalog c
      where c.program_code = o->>'value' and c.family_selectable
   )
order by 1, 2;

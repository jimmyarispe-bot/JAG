-- 438_every_state_scholarship_in_the_catalogue_2026_09_27.sql
--
-- Every state voucher, ESA, tax-credit scholarship and refundable credit in
-- the United States, recorded once so that admitting a family from any state
-- is a catalogue lookup rather than a form migration.
--
-- Jimmy, 27 September 2026:
--
--   "research other programs and state requirements. any state with a
--    voucher/scholarship program we need to build our forms for. we may not
--    be approved by those states now but i don't want to have to come back
--    and build this. build it now based on the research you do for every
--    single state we aren't already collecting scholarships from."
--
-- WHAT THIS IS. 89 programmes across 38 states, the District of Columbia and
-- the federal Section 25F credit. Seven of the 89 are rows that already
-- existed and are enriched in place, never duplicated: the four Step Up
-- programmes from 322, `ga_esa` (which is Georgia Special Needs, whatever the
-- code looks like), `ga_goal`, and `tx_esa`. Three more - az_esa, ar_efa,
-- ga_promise, nc_esa_plus - came from 309 and upsert onto themselves. Researched 27 September 2026 against state
-- agency and programme-administrator sources, with EdChoice as a fallback.
-- Twelve states and jurisdictions have no K-12 private-school choice programme
-- at all and therefore have no row: CA, CO, CT, DE, HI, MA, MI, NJ, NM, NY,
-- ND, OR, WA. Their absence is the finding, not an omission.
--
-- WHAT THIS IS NOT. It is not a claim that The Academy Way participates in any
-- of these. `is_active` says the programme exists and is running; whether we
-- are an approved provider is a different fact and lives elsewhere.
--
-- SIX NEW COLUMNS, because the existing table could not hold the research:
--
--   program_type            esa / voucher / tax_credit_scholarship /
--                           refundable_tax_credit / town_tuitioning
--   program_status          active / phasing_in / launching / inactive /
--                           repealed
--   family_identifier_label The exact published name of the number or document
--                           a family can hand us - "Enrollment Verification
--                           Number", "Student Test Number (STN)", "AAA ID".
--                           NULL is the common case and it is load-bearing:
--                           most states publish nothing a family can quote, so
--                           a form that demands an award ID from everyone is a
--                           form most families cannot submit. This column is
--                           what stops us building that.
--   family_selectable       Whether this programme is offered to a parent in
--                           the admissions form. False for repealed
--                           programmes, for tax deductions a family claims on
--                           their own return, and for Florida and Georgia,
--                           which already have their own sections.
--   documents_note          The researcher's prose on what the family gives
--                           the SCHOOL, as distinct from the state. Kept
--                           verbatim so the next person can check the slugs.
--   research_confidence     What was verified, on what source, and what was
--                           not. A row nobody can audit is a row nobody
--                           should trust.
--
-- `required_documents` holds slugs the form can act on, not prose:
--   award_letter, iep_or_504, etr_evaluation, diagnosis_report,
--   proof_of_residency, birth_certificate, income_tax_return,
--   income_documentation, custody_papers, choice_endorsement_form,
--   edchoice_request_form, snsp_student_application, esa_service_plan,
--   signed_esa_contract, school_acceptance_letter, hope_notification_form,
--   proof_of_public_school_withdrawal, district_tuition_authorisation,
--   school_placement_form, individual_learning_plan.
--
-- Safe to re-run: every insert is an upsert on program_code, and the four
-- Florida rows migration 322 already created are updated, never duplicated.

alter table public.funding_program_catalog
  add column if not exists program_type text,
  add column if not exists program_status text,
  add column if not exists family_identifier_label text,
  add column if not exists family_selectable boolean not null default false,
  add column if not exists documents_note text,
  add column if not exists research_confidence text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'funding_program_catalog_program_type_check'
  ) then
    alter table public.funding_program_catalog
      add constraint funding_program_catalog_program_type_check
      check (program_type is null or program_type in
        ('esa','voucher','tax_credit_scholarship','refundable_tax_credit','town_tuitioning'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'funding_program_catalog_program_status_check'
  ) then
    alter table public.funding_program_catalog
      add constraint funding_program_catalog_program_status_check
      check (program_status is null or program_status in
        ('active','phasing_in','launching','inactive','repealed'));
  end if;
end $$;

comment on column public.funding_program_catalog.family_identifier_label is
  'The exact published name of the award number or document a family can quote to a school, or NULL where the state publishes none. Most states publish none.';
comment on column public.funding_program_catalog.family_selectable is
  'Whether a parent is offered this programme in the admissions form.';

-- ── the catalogue ────────────────────────────────────────────────────────────

insert into public.funding_program_catalog (
  program_code, program_name, state_code, funding_agency,
  maximum_award, payment_schedule, renewal_rules, required_documents,
  export_format, website, is_active, school_id,
  program_type, program_status, family_identifier_label, family_selectable,
  documents_note, research_confidence
) values
  ('az_esa', 'Empowerment Scholarship Account (ESA) Program', 'AZ', 'Arizona Department of Education, ESA Program (esa.azed.gov / esaportal.azed.gov)',
   47725.0, 'quarterly', 'Annual contract renewal. Parents sign a new ESA contract each fiscal year; contracts signed Oct 1-Dec 31 use prior-year funding factors. Continuing students do not re-establish eligibility.', '["award_letter", "signed_esa_contract", "proof_of_residency", "iep_or_504"]'::jsonb,
   'csv', 'https://www.azed.gov/esa', true, null,
   'esa', 'active', 'ESA Application ID', true,
   'Not prescribed by ADE - ADE regulates the parent, not the school. In practice a school should collect: the ESA award/funding notification (or portal screenshot showing the contract year and award amount), the signed ESA contract page, and the ESA Application ID. For eligibility context: student birth certificate, proof of Arizona residency (utility bill within 60 days, or two secondary documents, or notarized Affidavit of Shared Residence), and, for disability-category students, current IEP, MET, or 504 Plan. Explicitly NOT to be collected: ClassWallet login credentials or card numbers - the handbook forbids families sharing these.', 'medium - program status, eligibility pathways, documents and ClassWallet mechanics verified on azed.gov (Sept 2026). Could not verify the exact 2026-27 award table on an azed.gov page; the dollar ranges come from a secondary aggregator citing ADE. The handbook I could read is the 2025-26 edition; a 2026-27 handbook may supersede it.'),
  ('az_sto_original', 'Original Individual Income Tax Credit Scholarship Program (Certified School Tuition Organizations)', 'AZ', 'Arizona Department of Revenue certifies the STOs; families deal with an individual certified STO (e.g., ACSTO, Arizona Tuition Connection, Institute for Better Education, Catholic Education Arizona)',
   null, 'annual', 'Annual - the family reapplies to the STO each year; each STO sets its own window (most run spring for the following school year).', '["award_letter"]'::jsonb,
   'csv', 'https://azdor.gov/tax-credits/credits-contributions-certified-school-tuition-organizations', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'Varies by STO. Typically the STO award letter naming the school and amount. The STO (not the school) collects the financial-need application, prior-year tax return or income documentation, and enrollment confirmation.', 'medium - program existence, four-credit structure and 2026 donor caps verified at azdor.gov. Family-side award documents vary by STO and were not verified against a specific STO handbook.'),
  ('az_sto_switcher', '"Switcher" (Overflow / PLUS) Individual Income Tax Credit Scholarship Program', 'AZ', 'Arizona Department of Revenue certifies STOs; families deal with the STO',
   null, 'annual', 'Annual reapplication to the STO; once a student qualifies as a switcher, the status persists for subsequent years.', '["award_letter", "proof_of_prior_public_school"]'::jsonb,
   'csv', 'https://azdor.gov/tax-credits/credits-contributions-certified-school-tuition-organizations', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'STO award letter. The distinguishing family requirement is proof the student "switched": attended an Arizona public school for at least 90 days of the prior year (or is entering kindergarten, moving from out of state, a prior ESA holder, or a prior Switcher recipient). The STO collects the evidence of that, typically a public-school withdrawal form, report card or enrollment record.', 'medium - structure and 2026 caps verified at azdor.gov; the 90-day switcher documentation detail is from statute/STO practice, not re-verified on a 2026 official page.'),
  ('az_sto_lowincome_corp', 'Low-Income Corporate Income Tax Credit Scholarship Program', 'AZ', 'Arizona Department of Revenue (credit pre-approval); families deal with a certified STO',
   null, 'annual', 'Annual reapplication to the STO.', '["award_letter"]'::jsonb,
   'csv', 'https://azdor.gov/tax-credits/credits-contributions-certified-school-tuition-organizations', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'STO award letter. Family must document household income at or below 185% of the federal reduced-price-lunch income standard and must meet a "switcher"-type prior public school / entering-kindergarten / prior-recipient test. The STO collects prior-year tax returns or other income proof and prior enrollment evidence.', 'medium - cap and program verified at azdor.gov; income threshold and per-student ceiling figures for 2026-27 not verified on an official 2026 page.'),
  ('az_sto_lexies_law', 'Lexie''s Law for Disabled and Displaced Students Tax Credit Scholarship Program (Disabled/Displaced Corporate Credit)', 'AZ', 'Arizona Department of Revenue (credit pre-approval); families deal with a certified STO',
   null, 'annual', 'Annual reapplication to the STO.', '["award_letter", "iep_or_504"]'::jsonb,
   'csv', 'https://azdor.gov/tax-credits/credits-contributions-certified-school-tuition-organizations', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'STO award letter, plus evidence of the qualifying status: a current IEP, MET or 504 Plan from an Arizona public school, or documentation of foster care placement at any time before high school graduation.', 'medium - program and cap verified at azdor.gov; family documentation from statute and EdChoice, not an official 2026 family handbook.'),
  ('ar_efa', 'Arkansas Children''s Educational Freedom Account (EFA) Program (LEARNS Act)', 'AR', 'Arkansas Department of Education, Division of Elementary and Secondary Education - Office of School Choice and Parent Empowerment',
   7208.0, 'quarterly', 'Annual reapplication during the designated window. The 2026-27 window opened March 2026 with a June 1, 2026 deadline; applications after that are subject to funding availability. Renewal application asks families to verify/update information.', '["award_letter"]'::jsonb,
   'csv', 'https://dese.ade.arkansas.gov/offices/office-of-school-choice-and-parent-empowerment/education-freedom-accounts (family handbook: https://dese.ade.arkansas.gov/Files/AR_EFA_Family_Handbook_2025-26_OSCPE.pdf)', true, null,
   'esa', 'active', null, true,
   'Not prescribed. For the state application the family uploads proof of student age (birth certificate, passport, immunization record or state ID) and proof of Arkansas residency (utility bill, lease or Arkansas driver''s license); returning families are not required to resubmit these. A school should collect the EFA award notification/approval letter and confirm the student in ClassWallet. The school must also verify enrollment before funds disburse, so an enrollment verification form is a school-side artifact the family signs.', 'medium-high - the $7,208 figure and June 1 deadline are from March 2026 Arkansas Democrat-Gazette reporting on DESE''s announcement; the DESE EFA pages are robots-blocked to automated fetch so I read the 2025-26 official family handbook plus the DESE family-details page. A 2026-27 official family handbook exists but I could not retrieve it directly.'),
  ('fl_hope', 'Hope Scholarship Program', 'FL', 'Step Up For Students administers the private school scholarship; the public school district triggers eligibility; FDOE oversees',
   null, 'quarterly', 'Once awarded, the student may renew through Step Up until graduation without a new incident; annual confirmation through EMA.', '["award_letter", "hope_notification_form"]'::jsonb,
   'csv', 'https://www.fldoe.org/schools/school-choice/k-12-scholarship-programs/hope/', true, null,
   'voucher', 'active', 'Award ID', false,
   'The completed "Hope Notification Form" is the distinguishing document - the district must give the parent information about the Hope Scholarship within 15 days of a reported incident, and the form must be filled out completely for the family to apply. The school will then need the Step Up Award ID and EMA enrollment approval. Qualifying incidents: battery, harassment, hazing, bullying, kidnapping, robbery, sexual offenses, threats, fighting or similar, reported to school personnel.', 'medium - status, eligibility and the Hope Notification Form verified on fldoe.org; the 2026-27 award amount is not published on that page and SB 318 (which would have renamed it the "Hope Program") died in Messages on 3/13/2026, so the name is unchanged.'),
  ('fl_nwsa', 'New Worlds Scholarship Accounts (NWSA)', 'FL', 'Step Up For Students in partnership with the State of Florida',
   1200.0, 'quarterly', 'No new applications for 2026-27 due to lack of new funding. Existing accounts must show spending between July 1, 2026 and June 30, 2027 or they are closed and funds returned to the state.', '[]'::jsonb,
   'csv', 'https://www.stepupforstudents.org/scholarships/new-worlds-scholarship-accounts/', false, null,
   'esa', 'inactive', 'Award ID', false,
   'Not applicable - NWSA never covered private school tuition. It funded tutoring, summer/after-school reading and math programs, and instructional materials for students with reading or math difficulties.', 'high - the "not accepting applications" notice is current on Step Up''s site.'),
  ('ga_promise', 'Georgia Promise Scholarship (SB 233)', 'GA', 'Georgia Education Savings Authority (GESA), attached to the Georgia Student Finance Commission; the Governor''s Office of Student Achievement (GOSA) publishes the eligible-attendance-zone list; Odyssey is the platform vendor',
   6500.0, 'quarterly', 'Annual recertification - GESA sends a recertification to families to update information and maintain eligibility; the program site states a May 31 recertification deadline. Quarterly application windows: two in spring (March and May) and two in fall; for 2026-27 the remaining windows listed are August 1-31, 2026 and November 1-30, 2026. Families above 400% FPL can only be considered in the spring windows.', '["award_letter"]'::jsonb,
   'csv', 'https://mygeorgiapromise.org/', true, null,
   'esa', 'phasing_in', null, false,
   'The school confirms the family''s selection inside Odyssey rather than collecting paper. For the state application the family uploads: proof of Georgia residency (Georgia driver''s license or state ID plus a utility bill, mortgage statement, deed or lease); proof of prior public school enrollment for the full prior academic year (report cards or attendance records - kindergarteners exempt); income verification, most recent federal 1040 or 1040EZ, or approved alternatives (SNAP, Medicaid, TANF, LIHEAP, SSDI/SSI documentation); active-duty orders if claiming the military exemption from the one-year residency rule.', 'medium - award amount, windows, school requirements and family upload list verified on mygeorgiapromise.org and its handbooks (the private school handbook I could read is dated 4/01/25). There is a conflict between the current site (Aug and Nov 2026 windows, recertify by May 31) and the program timeline PDF (spring March/May plus two fall windows); I could not resolve which governs 2026-27 precise'),
  ('ga_esa', 'Georgia Special Needs Scholarship Program (GSNS, SB 10 / SB 47)', 'GA', 'Georgia Department of Education (GaDOE)',
   null, 'quarterly', 'Annual. Parents must submit a scholarship application by one of three deadlines each year: September 15, December 15, or February 15. Students must also be enrolled in an authorized private school by GaDOE''s annually established deadline.', '["award_letter", "iep_or_504", "proof_of_public_school_withdrawal"]'::jsonb,
   'csv', 'https://gadoe.org/parent-family-resources/georgia-special-needs-scholarship/', true, null,
   'voucher', 'active', 'GaDOE scholarship award sheet', false,
   'The GaDOE scholarship award sheet - this is the load-bearing document and a school should require it. Also: evidence of withdrawal from the public school (no dual enrollment permitted), and, in practice, the student''s most recent IEP. Eligibility itself is verified by GaDOE against public school records: the student must have been enrolled and reported by a Georgia public school district in the preceding October and March FTE counts and have received IEP services from a public school the prior year. Parent must have resided in Georgia at least one year (active-duty military exempt). The parent signs an acknowledgment of full financial responsibility for all educational costs at the private school beyond the scholarship.', 'medium-high - parent duties, the "award sheet" term, deadlines and full school requirement list verified in State Board Rule 160-5-1-.34. I could not confirm whether the three application deadlines changed for 2026-27, and I could not pull a 2026-27 award calculation table.'),
  ('ga_goal', 'Qualified Education Expense Tax Credit (Student Scholarship Organization scholarships - Georgia GOAL, Apogee, Arete Scholars, Georgia SSO and others)', 'GA', 'Georgia Department of Revenue administers the credit and its statewide cap; families deal with an individual Student Scholarship Organization (SSO), and the SSO is usually paired with a specific private school',
   null, 'annual', 'Annual reapplication to the SSO; most run a spring window for the following school year. Donor credit pre-approval opens January 1 each year and the statewide cap is routinely oversubscribed on day one.', '["award_letter"]'::jsonb,
   'csv', 'https://dor.georgia.gov/qualified-education-expense-tax-credit-0', true, null,
   'tax_credit_scholarship', 'active', null, false,
   'SSO award letter. The SSO (typically in partnership with the school) collects the financial-need application - prior-year federal tax return, W-2s, and often a third-party need assessment (FACTS/Clarity) - plus proof the student meets the eligibility gate: enrolled in a Georgia public school for at least six weeks immediately prior, or entering pre-K, kindergarten or first grade, or moving from out of state, or a prior SSO recipient, or a military dependent.', 'medium - program status and the DOR cap process verified (2026 cap status document dated 1/22/2026). Eligibility gate and family documentation come from statute and SSO practice rather than an official 2026-27 family handbook, and specifics vary meaningfully by SSO.'),
  ('al_choose', 'CHOOSE Act Education Savings Account (Creating Hope and Opportunity for Our Students'' Education Act of 2024)', 'AL', 'Alabama Department of Revenue (ALDOR); ClassWallet is the platform',
   7000.0, 'quarterly', 'Annual. Parents renew the ESA in the ClassWallet platform for each academic year. The 2026-27 application window closed at midnight March 31, 2026; award notifications began April 15, 2026. Unused funds revert to the program at year end. Priority order for 2026-27: first 500 awards to students with special needs, then 2025-26 recipients, then children of active-duty service members at priority schools, then by AGI as a percentage of the poverty level, with sibling priority.', '["award_letter"]'::jsonb,
   'csv', 'https://www.revenue.alabama.gov/tax-policy/the-choose-act/', true, null,
   'refundable_tax_credit', 'phasing_in', null, true,
   'Not prescribed by ALDOR. A school should collect the ALDOR award notification and confirm the student in ClassWallet. For the state application the family submits: income verification (tax returns, W-2s, benefit statements or other income documentation - household AGI must not exceed 300% FPL based on the 2025 tax year); proof of residency (driver''s license, utility bill, lease or similar); guardianship documentation (birth certificate, adoption papers or guardianship records); a current IEP, ISP or 504 Plan if claiming special-needs status (the first 500 awards each year are reserved for students with special needs); military ID or orders if claiming active-duty priority.', 'high - award amounts, income test, priority order, application dates, family documents and school requirements all verified on ALDOR pages and ALDOR Administrative Code chapter 810-28-1. No official family award-identifier term exists.'),
  ('al_esp_sgo', 'Education Scholarship Program (Alabama Accountability Act - Scholarship Granting Organizations)', 'AL', 'Alabama Department of Revenue certifies SGOs and maintains the qualified SGO and participating nonpublic school lists; families deal directly with an SGO (e.g., Scholarships for Kids, Alabama Opportunity Scholarship Fund, Rocket City Scholarship Granting Organization)',
   10000.0, 'annual', 'Annual reapplication to the SGO; each SGO sets its own window, typically spring for the following school year.', '["award_letter"]'::jsonb,
   'csv', 'https://www.revenue.alabama.gov/individual-corporate/alabama-accountability-act/', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'SGO award letter. The SGO collects household income documentation (prior-year tax return, W-2s or benefit statements - the family income test is tied to a percentage of state median household income, with a higher threshold for renewals), proof of Alabama residency, and, where the student is claimed under the priority-school pathway, documentation of assignment to a school on ALDOR''s "failing"/priority school list. Students with an IEP or 504 plan who attended an Alabama school the prior year qualify regardless of the other limits. No more than one quarter of each year''s first-time recipients may have attended a private school the previous year, so the SGO also collects prior-year enrollment evidence.', 'medium - program status, SGO structure, $40M cap and average award verified (ALDOR page plus EdChoice). ALDOR''s page does not publish current income limits, per-grade award ceilings or the failing-school list inline, so those figures are from statute and secondary sources and I could not confirm the 2026-27 values.'),
  ('al_eftc', 'Education Freedom Tax Credit Program (Alabama''s participation in the federal SGO tax credit created by the 2025 federal reconciliation act)', 'AL', 'Alabama Department of Revenue (ALDOR), in coordination with the U.S. Treasury and Department of Education; scholarships will flow through certified SGOs',
   null, 'annual', 'unknown', '[]'::jsonb,
   'csv', 'https://www.revenue.alabama.gov/tax-policy/the-education-freedom-tax-credit-program-alabamas-part-in-the-federal-sgo-program/', false, null,
   'tax_credit_scholarship', 'launching', null, false,
   'None specified publicly. Eligibility will be households earning up to 300% of area median income (HUD AMI by county/city), so income documentation is expected.', 'high on status (Alabama opted in via Executive Order No. 742 signed January 16, 2026; ALDOR page last updated April 13, 2026 confirms the program begins in 2027 and rules are pending). Low on all operational detail because none exists yet. Georgia also moved SB 446 in 2026 to align state law with this federal program - worth watching in GA as well.'),
  ('ms_esa', 'Education Scholarship Account (ESA) Program - Equal Opportunity for Students with Special Needs Act', 'MS', 'Mississippi Department of Education, Office of Special Education (portal at scholarships.mdek12.org / mde-scholarship-esa.mdek12.org)',
   8007.0, 'quarterly', 'Not a full annual reapplication. Continuing participants complete a Recertification Form between April 1 and April 30 each year; missing that window forfeits the scholarship. Students without permanent disabilities must re-document continuing disability status every three years. New applications are accepted year-round, reviewed within 21 business days, first-come first-served; December through May is the practical window to be awarded before the school year begins.', '["award_letter", "school_acceptance_letter"]'::jsonb,
   'csv', 'https://www.mdek12.org/specialeducation/esa/', true, null,
   'esa', 'active', null, true,
   'The ESA award letter. Critically, the direction also runs the other way: the family must give MDE a letter of acceptance from the eligible private school verifying the child has been accepted - so the school issues an acceptance letter before the award is finalized. The family''s application to MDE includes: copy of parent driver''s license or state ID; student birth certificate; proof of Mississippi residency; the student''s most recent IEP (active within three years); the eligibility ruling / evaluation documentation; a signed parental responsibilities agreement; and the school acceptance letter. Families must also submit pre- and post-assessment results each school year or risk forfeiture.', 'medium - application documents, recertification window, school requirements and reimbursement mechanics verified in the 2024 PEER statutory review and MDE materials. The $8,007 figure is the 2025-26 maximum from a secondary guide; I could not retrieve a 2026-27 amount from mdek12.org (that site returned 403 to automated fetch). The 500-student annual cap was removed and funding raised from $3M to '),
  ('ms_dyslexia', 'Dyslexia Therapy Scholarship for Students with Dyslexia Program', 'MS', 'Mississippi Department of Education (Office of Elementary Education and Reading / dyslexia program)',
   6847.0, 'quarterly', 'Annual; the family reapplies/recertifies through MDE.', '["award_letter", "diagnosis_report"]'::jsonb,
   'csv', 'https://mdek12.org/elementaryedu/dyslexia/', true, null,
   'voucher', 'active', null, true,
   'Documentation of a dyslexia diagnosis and the MDE scholarship award. MDE has not published a definitive family document checklist; a school should require the MDE award letter plus the diagnostic report. Grades 1-6 (extendable through 12 in some circumstances) and the student must have been enrolled in a Mississippi public school or be entering first grade.', 'low-medium - program status, award formula and the special-purpose-school restriction verified via EdChoice; MDE''s own pages returned 403 to automated fetch, so I could not confirm 2026-27 amounts, deadlines or a family document list from the official source.'),
  ('ms_nate_rogers', 'Nate Rogers Scholarship for Students with Disabilities (Speech-Language Therapy Scholarship)', 'MS', 'Mississippi Department of Education, Office of Special Education (contact nate_rogers@mdek12.org, 601-359-3498)',
   6847.0, 'quarterly', 'Annual through MDE.', '["award_letter", "diagnosis_report"]'::jsonb,
   'csv', 'https://mdek12.org/specialeducation/special-education-speech-language-therapy-scholarship/', true, null,
   'voucher', 'active', null, true,
   'Not specified publicly. Expect the MDE award letter plus documentation of a speech-language impairment. The program is limited to students in grades K-6 with a speech-language impairment.', 'low - program existence and the special-purpose-school restriction confirmed, but MDE pages returned 403 and I could not verify 2026-27 award amount, application window or family documents from an official source. This is a very small program.'),
  ('ms_childrens_promise', 'Children''s Promise Act tax credits (Educational Services Charitable Organizations / ECOs)', 'MS', 'Mississippi Department of Revenue allocates the credits; families deal with the individual charitable organization or school',
   null, 'annual', 'Credit allocations are annual and first-come; no family renewal exists.', '[]'::jsonb,
   'csv', 'https://www.dor.ms.gov/forms-resources/incentives-credits/charitable-credits/eco-esco-esps', true, null,
   'tax_credit_scholarship', 'active', null, false,
   'None specified. Note that MDOR explicitly states "providing scholarships, day-care, therapy, or treatment does not qualify as educational services" for an ESCO, so this credit funds instruction, tutoring and enrichment at organizations serving foster children, children with chronic illness or disability, and children eligible for free/reduced-price meals - it is not a tuition voucher.', 'medium on the tax structure and the 2026 cap increase; high confidence that this should NOT be treated as a family award on a school admissions form.'),
  ('la_gator', 'LA GATOR Scholarship Program (Louisiana Giving All True Opportunity to Rise)', 'LA', 'Louisiana Department of Education (LDOE); Odyssey is the application and payment platform (support 225-422-1538)',
   15253.0, 'quarterly', 'Annual. The 2026-27 application window ran March 1-16, 2026; returning participants must renew to keep eligibility and are the first priority. Priority order when funding is short: current LSP or LA GATOR participants; low-income (≤250% FPL) students and students with IDEA disabilities; siblings of current participants; all other eligible students. Waiting list positions are communicated.', '["award_letter"]'::jsonb,
   'csv', 'https://doe.louisiana.gov/topic-pages/louisiana-school-choice/la-gator/la-gator-families', true, null,
   'esa', 'phasing_in', null, true,
   'The school confirms enrollment and tuition inside Odyssey rather than collecting paper. For the state application the family submits: Social Security Number or ITIN; Louisiana residency verification (a valid ID plus two utility or property documents); income verification, normally by an automated connection to the Louisiana Department of Revenue, with a 1040 upload if income cannot be verified that way; for disability-tier students, IDEA/IEP or evaluation documentation establishing the exceptionality tier; proof of public school enrollment on both October 1 and February 1 of the prior school year, if qualifying on that pathway. Student must be a Louisiana resident aged 5-21 by September 30, 2026.', 'medium - 2026-27 eligibility rules, application window (March 1-16, 2026), family documents and school requirements verified on doe.louisiana.gov. The dollar amounts I could verify are the 2025-26 tier amounts; LDOE''s funding page had not published the 2026-27 recalculation (based on the 2025-26 MFP base) at the pages I could reach, so treat the amounts as approximate for 2026-27. Note the Louisia'),
  ('la_tdc', 'Tuition Donation Credit Program (formerly Tuition Donation Rebate Program)', 'LA', 'Louisiana Department of Education approves the School Tuition Organizations; Louisiana Department of Revenue administers the credit; families deal directly with an STO. Four STOs operate: ACE Scholarships Louisiana, Arete Scholars Louisiana, Aspiring Scholars Louisiana, Son of a Saint Louisiana.',
   null, 'annual', 'Annual reapplication to the STO; each STO sets its own window.', '["award_letter"]'::jsonb,
   'csv', 'https://doe.louisiana.gov/topic-pages/louisiana-school-choice/tuition-donation-credit-program', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'STO award letter. The STO collects: proof of Louisiana residency; income documentation showing family income at or below 250% of the federal poverty line (about $80,375 for a family of four in 2025-26); and evidence of the prior-schooling gate - attended a Louisiana public school on both October 1 and February 1 of the most recent school year, or is entering kindergarten for the first time, or participated in the program the previous year. Priority goes to returning scholarship students.', 'medium - eligibility, award caps and the four-STO list verified on doe.louisiana.gov. Status is "active, no repeal found" rather than positively confirmed for 2026-27; participation figures are 2023-24 and the program may be shrinking as LA GATOR absorbs demand. A school in Louisiana should confirm with the specific STO. TOWN TUITIONING: None of the seven states has a town tuitioning program. Town'),
  ('in_choice', 'Choice Scholarship Program (Indiana school voucher)', 'IN', 'Indiana Department of Education (IDOE), Office of School Finance / Choice; the family deals with the participating Choice school, which files the application',
   8328.56, 'semester', 'Annual. Two application periods: Period 1 closes September 1; Period 2 (half award) November 1-January 15. School files each year; withdrawal forfeits the remaining award', '["award_letter", "choice_endorsement_form", "proof_of_residency", "birth_certificate"]'::jsonb,
   'csv', 'https://www.in.gov/doe/students/indiana-choice-scholarship-program/', true, null,
   'voucher', 'active', 'Student Test Number (STN)', true,
   '(a) documentation of legal settlement/Indiana residency; (b) proof of age/date of birth (5-21 by Oct 1); (c) signed Choice Scholarship Endorsement Form - payment is blocked without it; (d) historically, prior-year federal tax return plus IDOE Household Summary Form, and an Income Calculation Worksheet or Income Assurance Form if no return was filed. **Caveat:** with the 400%-of-FRL income test removed for 2026-27 under HEA 1001 (2025), IDOE had not yet published a 2026-27 eligibility/FAQ document as of 2026-09-27, so whether income documents are still collected is unconfirmed', 'medium - award amounts and mechanics are from IDOE''s own 2026-27 award file and the 2025-26 FAQ (verified). Universal eligibility for 2026-27 is confirmed by HB 1001 (signed 2025-05-06) and EdChoice (updated 2025-12-16), but IDOE''s page still linked only 2025-2026 eligibility documents, so the exact 2026-27 family document list is not verified.'),
  ('in_esa', 'Indiana Education Scholarship Account (INESA / Indiana ESA)', 'IN', 'Indiana Department of Education - administration transferred from the Office of the Indiana Treasurer of State effective July 1, 2026. Contact ESA@doe.in.gov; portal at scholarships.tos.in.gov',
   20000.0, 'quarterly', 'Annual. 2026-27 enrollment opened March 1, 2026. Accounts are valid one school year and terminate automatically if not renewed within 395 days of establishment or last renewal', '["award_letter", "iep_or_504", "proof_of_residency", "esa_service_plan"]'::jsonb,
   'csv', 'https://www.in.gov/tos/inesa/', true, null,
   'esa', 'active', 'Student Test Number (STN)', true,
   'Disability documentation - an IEP, a service plan under 511 IAC 7-34, a choice special education plan, or a Section 504 plan; proof of legal settlement in Indiana; the student''s STN; an ESA Service Plan that must be updated when services change or at renewal. The family also signs the INESA Parent Program Agreement (statewide assessment participation: IREAD, ILEARN, IAM, SAT, WIDA; one account per student; no concurrent public/charter enrollment or Choice Scholarship)', 'high on mechanics, agency transfer, ClassWallet and renewal; medium on the exact family document list a private school (as opposed to a therapy provider) collects, since IDOE''s 2026 FAQ does not enumerate it.'),
  ('in_sgo', 'School Scholarship Tax Credit Program (SGO Scholarships)', 'IN', 'IDOE certifies the Scholarship Granting Organizations; the family deals with a certified SGO through their school (8 SGOs certified as of the current IDOE FAQ - e.g. Institute for Quality Education, Sagamore Institute, Community Foundation of Elkhart County)',
   null, 'annual', 'Annual - income must be re-verified each year', '["award_letter", "income_tax_return"]'::jsonb,
   'csv', 'https://www.in.gov/doe/students/indiana-choice-scholarship-program/school-scholarships/', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'SGO scholarship application (the school completes it with the parent/guardian) and annual household income verification documentation. Proof of legal settlement in Indiana and student age (4+ and under 22 on/before August 1). Specific income document types are set by each SGO, not by statute', 'medium - program structure and the annual income-verification requirement are confirmed from IDOE''s FAQ. **Unverified:** whether the 400%-of-NSLP income ceiling for SGO scholarships survived the 2025 budget that made Choice universal. Receiving an SGO scholarship has historically also been a Choice Scholarship eligibility pathway; with Choice now universal that pathway is moot.'),
  ('ia_esa', 'Students First Education Savings Accounts (Iowa ESA)', 'IA', 'Iowa Department of Education, with Odyssey (withodyssey.com) as the third-party administrator families actually interact with',
   8148.0, 'semester', 'Annual reapplication - no automatic renewal. 2026-27 window: April 16, 2026 8:00 a.m. through June 30, 2026 11:59 p.m.', '["award_letter"]'::jsonb,
   'csv', 'https://educate.iowa.gov/pk-12/educational-choice/education-savings-accounts', true, null,
   'esa', 'active', null, true,
   'Nothing is mandated by the state for the school to collect. The documents go to Odyssey/the state, not the school: parent legal name, contact info and SSN/ITIN; current residential address and the address on the 2025 tax return (residency is verified against Iowa tax records); student legal name, DOB and address. In practice the school needs the family to select that school in the Odyssey portal and to complete the school''s own enrollment contract - selecting a school in Odyssey is explicitly NOT enrollment', 'high on amount, universality, window, administrator and payment order; medium on exactly what a school must collect from the family, which the state does not specify.'),
  ('ia_sto', 'School Tuition Organization Tax Credit', 'IA', 'Iowa Department of Revenue (donor credits) and Iowa Department of Education (STO registration); families apply to one of ~12 certified School Tuition Organizations, each serving a defined set of schools',
   null, 'annual', 'Annual application to the STO; deadlines set by each STO (commonly spring)', '["award_letter", "income_tax_return"]'::jsonb,
   'csv', 'https://educate.iowa.gov/pk-12/educational-choice/school-tuition-organizations', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'STO scholarship application (usually distributed and collected by the school) plus household income documentation to show income at or below 400% of the Federal Poverty Level - typically the prior-year federal tax return or W-2s, as each STO specifies. Not standardized statewide', 'medium - 400% FPL ceiling, credit rate and cap confirmed; individual STO paperwork varies and is not published centrally. Note many Iowa families now take the ESA instead, and Iowa dioceses created a new SGO in August 2026 for the federal credit, which is separate from this program.'),
  ('ia_ttc', 'Tuition and Textbook Tax Credit', 'IA', 'Iowa Department of Revenue (claimed on the IA 1040)',
   500.0, 'annual', 'Claimed each tax year', '[]'::jsonb,
   'csv', 'https://revenue.iowa.gov/taxes/tax-guidance/individual-income-tax/1040-expanded-instructions/tuition-textbook-credit-k-12', true, null,
   'refundable_tax_credit', 'active', null, false,
   'None. The family keeps receipts; schools are often asked for a tuition/fees statement but the state mandates nothing', 'high. Important interaction: expenses paid with Students First ESA funds are NOT eligible for this credit.'),
  ('oh_edchoice', 'Educational Choice Scholarship Program (EdChoice "Traditional" / performance-based)', 'OH', 'Ohio Department of Education and Workforce (DEW), Office of Nonpublic Educational Options. The private school submits the application on the family''s behalf through DEW''s online system',
   8408.0, 'semester', 'Annual renewal through grade 12 using the Renewal Form. Conditions: student takes required assessments, has no more than 20 unexcused absences, and does not move to a different public school district (with exceptions). Application window for 2026-27: February 1, 2026 through June 30, 2027', '["edchoice_request_form", "birth_certificate", "proof_of_residency", "custody_papers"]'::jsonb,
   'csv', 'https://education.ohio.gov/Topics/Other-Resources/Scholarships/EdChoice-Scholarship', true, null,
   'voucher', 'active', 'EdChoice Request Form 2026-2027', true,
   'Completed EdChoice Request Form (or Renewal Form); a **certified copy of the student''s birth certificate**; **proof of residency less than 90 days old** - a utility bill under 90 days old with matching service and mailing address, OR a mortgage statement/lease plus current business mail in the parent''s name; custody or guardianship papers if applicable; a notarized letter, foster-care records or homelessness documentation for those eligibility pathways. The form itself contains the parent''s agreement to designate the school to apply and to **sign all scholarship checks in a timely manner**, with the parent liable for tuition if checks are not endorsed', 'high - the FY27 fact sheet and FY27 Request Form were both read directly.'),
  ('oh_edchoice_expansion', 'EdChoice Expansion Scholarship (income-based EdChoice)', 'OH', 'Ohio Department of Education and Workforce; income is verified through DEW''s Scholarship Income Verification System, which the parent accesses with an OH|ID account',
   8408.0, 'semester', 'Annual; year-round application window (2026-27 opened February 1, 2026). New applicants must complete income verification; renewals re-verify income', '["edchoice_request_form", "birth_certificate", "proof_of_residency", "income_tax_return", "custody_papers"]'::jsonb,
   'csv', 'https://education.ohio.gov/Topics/Other-Resources/Scholarships/EdChoice-Expansion', true, null,
   'voucher', 'active', 'EdChoice Request Form 2026-2027', true,
   'Completed EdChoice Request Form (the school submits it); certified birth certificate; proof of residency under 90 days old; custody papers if applicable; and **income documentation - effective July 1, 2025 only federal or state 1040 forms are accepted** for income verification. Income documents are uploaded by the parent to DEW through OH|ID or mailed to DEW, not necessarily held by the school, but schools routinely collect a copy to confirm the award tier', 'medium-high - award maxima, the 450% FPL threshold, the 200% FPL full-tuition rule and the 1040-only income rule are confirmed from DEW documents. **Could not verify** the exact dollar figures of the sliding-scale minimum award for the highest income bands in FY27.'),
  ('oh_cleveland', 'Cleveland Scholarship and Tutoring Program (Cleveland Scholarship)', 'OH', 'Ohio Department of Education and Workforce; private school staff assist families with the web-based application',
   8408.0, 'semester', 'Annual renewal through grade 12, with re-verification of continued residence in the district. 2026-27 window: February 1, 2026 to June 30, 2027', '["proof_of_residency", "birth_certificate", "income_tax_return", "custody_papers"]'::jsonb,
   'csv', 'https://education.ohio.gov/Topics/Other-Resources/Scholarships/Cleveland-Scholarship', true, null,
   'voucher', 'active', null, true,
   'Proof of residence within Cleveland Municipal School District boundaries (re-verified at each renewal); student birth/age documentation; income documentation if claiming the ≤200% FPG tier; custody papers if applicable. DEW does not publish a single consolidated checklist for this program the way it does for EdChoice', 'medium-high - amounts, window, payment method and renewal confirmed from the FY27 fact sheet; the family document checklist is inferred and less explicitly published than EdChoice''s.'),
  ('oh_jpsn', 'Jon Peterson Special Needs Scholarship Program (JPSN)', 'OH', 'Ohio Department of Education and Workforce; families enroll directly with a registered JPSN provider, which handles the application',
   34000.0, 'quarterly', 'Annual; the IEP must remain current and be reviewed at least annually by the resident district', '["iep_or_504", "etr_evaluation"]'::jsonb,
   'csv', 'https://education.ohio.gov/Topics/Other-Resources/Scholarships/Jon-Peterson-Special-Needs-Scholarship', true, null,
   'voucher', 'active', null, true,
   '**A current, finalized IEP** written by the resident public school district with parental agreement, and **the Evaluation Team Report (ETR)** from that district showing the child qualifies for special education under IDEA. The disability condition on the ETR sets the dollar amount. Age documentation (3-21). Provider-specific enrollment forms', 'medium-high - FY27 dollar range and the IEP+ETR requirement are confirmed directly. **Could not verify** the full per-category table or the exact payment schedule for FY27.'),
  ('oh_autism', 'Autism Scholarship Program (ASP)', 'OH', 'Ohio Department of Education and Workforce; the registered provider assists with the application',
   34000.0, 'quarterly', 'Annual, contingent on a current IEP', '["iep_or_504", "etr_evaluation"]'::jsonb,
   'csv', 'https://education.ohio.gov/Topics/Other-Resources/Scholarships/Autism-Scholarship', true, null,
   'voucher', 'active', null, true,
   'A current IEP from the resident public school district identifying autism as the disability, and the supporting ETR; age documentation (3-21); provider enrollment agreement', 'high on the $34,000 FY27 amount and the IEP requirement; medium on the provider-side detail.'),
  ('oh_sgo', 'Scholarship Donation Credit (Ohio SGO tax-credit scholarships)', 'OH', 'Ohio Department of Taxation administers the donor credit; scholarship-granting organizations certified by the Ohio Attorney General award the scholarships. Families apply to an SGO, usually through their school or diocese',
   null, 'annual', 'Annual application to the SGO; deadlines set by the SGO', '["award_letter", "income_tax_return"]'::jsonb,
   'csv', 'https://tax.ohio.gov/individual/scholarship-donation-credit', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'Set by the individual SGO. Typically an SGO scholarship application and income documentation, because SGOs must give priority to low-income students (below 300% FPL). Not standardized by the state', 'medium - the credit mechanics and AG certification are confirmed, but Ohio does not publish a central family-facing handbook, so family paperwork varies entirely by SGO.'),
  ('oh_ace', 'Afterschool Child Enrichment (ACE) Educational Savings Account', 'OH', 'Was Ohio Department of Education and Workforce with MI Technologies as vendor',
   null, 'annual', 'n/a', '[]'::jsonb,
   'csv', 'https://education.ohio.gov/OhioACE (page updated 2025-11-26)', false, null,
   'esa', 'repealed', null, false,
   'n/a', 'high - DEW states "The Afterschool Child Enrichment (ACE) Education Savings Account program has ended," with a final claim deadline of October 15, 2025. Do not build it into 2026-27 admissions paperwork. (Ohio also has a separate nonrefundable state income tax credit of up to $500/$1,000 for tuition paid to a **nonchartered** nonpublic school; it requires nothing from the school at admissions beyo'),
  ('wi_mpcp', 'Milwaukee Parental Choice Program (MPCP)', 'WI', 'Wisconsin Department of Public Instruction (DPI), Private School Choice Programs. Families apply through DPI''s Online Parent Application and submit documents to the school',
   13799.0, 'quarterly', 'Annual - "All students that would like to participate in any Choice program must apply every year using the Online Parent Application." 2026-27 MPCP application period ran February 2 through January 5, in monthly windows', '["proof_of_residency", "income_documentation"]'::jsonb,
   'csv', 'https://dpi.wi.gov/parental-education-options/choice-programs', true, null,
   'voucher', 'active', null, true,
   '(a) **Residency documentation** - required of every applicant, new and continuing, per DPI''s "Residency Documentation Guidance for Parents," with an Alternative Residency Verification Form for unusual situations; (b) **income documentation for NEW students only** - either SSNs/taxpayer IDs so the Wisconsin Department of Revenue verifies income, or, under the DPI Income Determination method, the family answers income questions and submits supporting income documents directly to the school. Continuing (prior-year) participants and waitlist students are exempt from income documentation', 'medium-high - payment amounts, application windows, annual reapplication and the residency/income document split are confirmed from DPI pages. The school-requirement list is partly from statute and the DPI registration page and was **not fully verified item-by-item for 2026-27** (DPI''s registration page had already rolled forward to 2027-28).'),
  ('wi_rpcp', 'Racine Parental Choice Program (RPCP)', 'WI', 'Wisconsin Department of Public Instruction',
   13799.0, 'quarterly', 'Annual reapplication. 2026-27 window: February 2 through September 14, in monthly windows', '["proof_of_residency", "income_documentation"]'::jsonb,
   'csv', 'https://dpi.wi.gov/parental-education-options/choice-programs/student-applications', true, null,
   'voucher', 'active', null, true,
   'Same as MPCP - residency documentation from every applicant (must be a resident of the Racine Unified School District), and income documentation from new students only (SSN/DOR verification or DPI Income Determination with documents to the school). 2026-27 income ceiling: 300% FPL-equivalent, e.g. $96,450 for a family of four, with a $7,000 deduction from combined income for married parents', 'medium-high, same basis and same caveat as MPCP.'),
  ('wi_wpcp', 'Wisconsin Parental Choice Program (WPCP - statewide)', 'WI', 'Wisconsin Department of Public Instruction',
   13799.0, 'quarterly', 'Annual reapplication. 2026-27 window: February 2 through September 14, monthly windows', '["proof_of_residency", "income_documentation"]'::jsonb,
   'csv', 'https://dpi.wi.gov/parental-education-options/choice-programs/student-applications', true, null,
   'voucher', 'active', null, true,
   'Residency documentation (Wisconsin resident outside Milwaukee and Racine) from all applicants; income documentation from new students only. **WPCP''s income limit is tighter than MPCP/RPCP** - 2026-27: $34,430 (family of 1), $46,530 (2), $58,630 (3), $70,730 (4), $82,830 (5), $94,930 (6), +$12,100 per additional member; married parents subtract $7,000 from combined income first', 'medium-high. **Could not verify** the 2026-27 WPCP enrollment cap percentage (DPI''s "Changes to the WPCP for 2026-27" PDF returned a 404 at the time of research).'),
  ('wi_snsp', 'Special Needs Scholarship Program (SNSP)', 'WI', 'Wisconsin Department of Public Instruction (snsp@dpi.wi.gov). Parents apply on paper **directly to the school**, not through the online Choice portal',
   16477.0, 'quarterly', 'Annual. 2026-27 application period: July 1, 2026 through June 30, 2027 (a rolling, year-long window, unlike the Choice programs)', '["snsp_student_application", "iep_or_504"]'::jsonb,
   'csv', 'https://dpi.wi.gov/parental-education-options/special-needs-scholarship/student-applications/26-27', true, null,
   'voucher', 'active', 'SNSP Student Application', true,
   '(a) Completed **SNSP Student Application** (new participants) or **Transfer Request Form** (existing participants changing schools) - paper, submitted directly to the school; (b) **the child''s IEP or services plan**, either currently being implemented or created on or after September 15, 2023 with no subsequent reversal of the disability determination; (c) **proof of Wisconsin residency**, with an Alternative Residency Form available. No income test', 'high on amount, window, and the IEP + residency + paper-application document set, all read directly from DPI''s 2026-27 pages.'),
  ('wi_deduction', 'K-12 Private School Tuition Deduction', 'WI', 'Wisconsin Department of Revenue, claimed on the state return',
   10000.0, 'annual', 'Claimed each tax year', '[]'::jsonb,
   'csv', 'https://www.edchoice.org/school-choice/programs/wisconsin-k-12-private-school-tuition-deduction/', true, null,
   'refundable_tax_credit', 'active', null, false,
   'None required. Families typically request a tuition-paid statement from the school', 'medium - the $4,000/$10,000 limits and tuition-only rule are well established, but the EdChoice page was last updated 2024-09-27. **Key interaction:** tuition paid by a Choice/SNSP voucher or from a college savings account cannot be deducted, and fees, transportation and room and board do not qualify. A 2025 Wisconsin budget item proposing a deduction limitation was found in the legislative record'),
  ('il_invest_in_kids', 'Invest in Kids Act Scholarship Tax Credit Program', 'IL', 'Was Illinois Department of Revenue with approved SGOs (Empower Illinois, Big Shoulders Fund, etc.)',
   null, 'annual', 'n/a', '[]'::jsonb,
   'csv', 'https://tax.illinois.gov/programs/investinkids.html', false, null,
   'tax_credit_scholarship', 'repealed', null, false,
   'n/a', 'high - the program sunset December 31, 2023 after the General Assembly declined to extend it; contributions to an SGO after that date earn no credit, and no scholarships flow for 2026-27. Only donors'' unused pre-2024 credits carry forward (up to five years). As of 2026 no replacement program has been enacted. **Illinois has no voucher, no ESA and no active tax-credit scholarship.**'),
  ('il_eec', 'Education Expense Credit (K-12)', 'IL', 'Illinois Department of Revenue; claimed on IL-1040 Schedule ICR',
   750.0, 'annual', 'Claimed each tax year', '[]'::jsonb,
   'csv', 'https://tax.illinois.gov/research/publications/pubs/education-expense-credit-general-rules.html', true, null,
   'refundable_tax_credit', 'active', null, false,
   'None - but the flow runs the other way: **the school gives the family Form IL-1040-RCPT, "Receipt for Qualified K-12 Education Expenses,"** or an equivalent itemized receipt the family keeps for its records. Qualified expenses are tuition, book fees and lab fees; the first $250 is not creditable', 'medium-high - structure and the receipt form are confirmed; the $750 cap and AGI thresholds were not re-verified against the tax year 2026 instructions specifically.'),
  ('mn_k12_credit', 'K-12 Education Credit', 'MN', 'Minnesota Department of Revenue; claimed on Schedule M1ED with the M1 return',
   1500.0, 'annual', 'Claimed each tax year', '[]'::jsonb,
   'csv', 'https://www.revenue.state.mn.us/k-12-education-subtraction-and-credit (page dated 2025-12-15)', true, null,
   'refundable_tax_credit', 'active', null, false,
   'None. Families keep receipts', 'high, with one critical qualification for a school admissions form: **private school TUITION does NOT qualify for the credit.** Nonpublic tuition is an eligible expense for the SUBTRACTION only. The credit covers other qualifying education expenses (tutoring, instructional materials, transportation, music lessons, computer hardware/software up to a limit). Do not treat this as a tuition benefit.'),
  ('mn_k12_subtraction', 'K-12 Education Subtraction (Education Deduction)', 'MN', 'Minnesota Department of Revenue',
   2500.0, 'annual', 'Claimed each tax year', '[]'::jsonb,
   'csv', 'https://www.revenue.state.mn.us/k-12-education-subtraction-and-credit', true, null,
   'refundable_tax_credit', 'active', null, false,
   'None. Families keep receipts; schools are commonly asked for a tuition statement', 'high. Nonpublic school tuition IS an eligible expense for the subtraction. The same expense cannot be used for both the subtraction and the credit. **Minnesota has no voucher, no ESA and no tax-credit scholarship program** - these two income tax provisions are the entirety of its private school choice policy. Note on town tuitioning: none of these seven states has a town-tuitioning program. That m'),
  ('nc_opportunity', 'Opportunity Scholarship', 'NC', 'North Carolina State Education Assistance Authority (NCSEAA)',
   7942.0, 'semester', 'Reapply or renew each year in MyPortal and stay enrolled in an eligible nonpublic school', '["award_letter"]'::jsonb,
   'csv', 'https://k12.ncseaa.edu/opportunity-scholarship/', true, null,
   'voucher', 'active', null, true,
   'award letter', 'high'),
  ('nc_esa_plus', 'Education Student Accounts (ESA+)', 'NC', 'North Carolina State Education Assistance Authority (NCSEAA)',
   17000.0, 'semester', 'Renew each year in MyPortal; disability eligibility redetermination required on the state schedule', '["award_letter", "iep_or_504"]'::jsonb,
   'csv', 'https://k12.ncseaa.edu/the-education-student-accounts/', true, null,
   'esa', 'active', null, true,
   'award letter; signed ESA+ Parent Agreement', 'high'),
  ('nc_disability_grant', 'Special Education Scholarship Grants for Children with Disabilities', 'NC', 'North Carolina State Education Assistance Authority (NCSEAA)',
   null, 'semester', 'Not renewable, consolidated into the ESA+ program beginning 2023-24', '["award_letter"]'::jsonb,
   'csv', 'https://k12.ncseaa.edu/the-education-student-accounts/', false, null,
   'voucher', 'repealed', null, false,
   'award letter', 'medium'),
  ('sc_estf', 'Education Scholarship Trust Fund', 'SC', 'South Carolina Department of Education, funds managed through ClassWallet',
   7634.0, 'quarterly', 'Confirm continued participation each October and complete annual testing in grades 3-11', '["award_letter"]'::jsonb,
   'csv', 'https://ed.sc.gov/newsroom/estf-faq/', true, null,
   'esa', 'active', null, true,
   'itemized tuition invoice for ClassWallet Direct Pay', 'high'),
  ('sc_ecenc', 'Educational Credit for Exceptional Needs Children Fund', 'SC', 'Exceptional SC, with South Carolina Department of Revenue oversight',
   11000.0, 'lump_sum', 'Reapply between June 1 and September 30 each year; incumbent students receive priority', '["award_letter", "iep_or_504"]'::jsonb,
   'csv', 'https://www.exceptionalsc.org/apply/', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'award notification; exceptional needs eligibility documentation', 'high'),
  ('sc_ecenc_refundable', 'Refundable Educational Credit for Exceptional Needs Children', 'SC', 'South Carolina Department of Revenue',
   11000.0, 'annual', 'Request tentative approval on MyDORWAY and claim the credit again each tax year', '["award_letter", "iep_or_504"]'::jsonb,
   'csv', 'https://dor.sc.gov/tax-credits/ecenc-program-credits', true, null,
   'refundable_tax_credit', 'active', null, true,
   'none, family pays tuition directly and claims the credit on form I-361 with the SC1040', 'high'),
  ('tn_efs', 'Education Freedom Scholarship', 'TN', 'Tennessee Department of Education',
   7530.0, 'quarterly', 'Abbreviated renewal application in the EFS portal each year, due late January', '["award_letter"]'::jsonb,
   'csv', 'https://www.tn.gov/education/efs.html', true, null,
   'esa', 'active', 'notification of EFS approval', true,
   'notification of EFS approval; school confirms enrollment in the EFS portal', 'high'),
  ('tn_esa_pilot', 'Education Savings Account Pilot Program', 'TN', 'Tennessee Department of Education',
   10132.54, 'quarterly', 'Continued annual participation; second semester application window each September', '["award_letter"]'::jsonb,
   'csv', 'https://www.tn.gov/education/esa.html', true, null,
   'esa', 'active', null, true,
   'award notification; school confirms participation in the ESA portal', 'high'),
  ('tn_iea', 'Individualized Education Account Program', 'TN', 'Tennessee Department of Education',
   null, 'quarterly', 'Annual contract renewal; 2026-27 applications are closed with the next window in February 2027', '["award_letter", "iep_or_504"]'::jsonb,
   'csv', 'https://www.tn.gov/education/iea.html', true, null,
   'esa', 'active', null, true,
   'award notification; current IEP or eligibility documentation', 'medium'),
  ('va_eistc', 'Education Improvement Scholarships Tax Credits Program', 'VA', 'Virginia Department of Education, awards made by approved scholarship foundations',
   null, 'annual', 'Reapply to the scholarship foundation each year and remain within the income limit', '["award_letter", "income_tax_return"]'::jsonb,
   'csv', 'https://www.doe.virginia.gov/data-policy-funding/school-finance/education-improvement-scholarships-tax-credits-program', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'scholarship foundation award letter; proof of household income', 'medium'),
  ('wv_hope', 'Hope Scholarship Program', 'WV', 'West Virginia State Treasurer''s Office',
   5267.0, 'quarterly', 'Renewed annually until high school graduation or age 21 while eligibility continues', '["award_letter"]'::jsonb,
   'csv', 'https://www.hopescholarshipwv.com', true, null,
   'esa', 'active', 'Hope Scholarship award letter', true,
   'Hope Scholarship award letter; itemized tuition invoice for each payment request', 'low'),
  ('ky_eoa', 'Education Opportunity Account Program', 'KY', 'Kentucky Department of Revenue',
   null, 'annual', 'Not available, struck down by the Kentucky Supreme Court in 2022 and never implemented', '["award_letter"]'::jsonb,
   'csv', 'https://www.edchoice.org/state/kentucky/', false, null,
   'tax_credit_scholarship', 'repealed', null, false,
   'none', 'medium'),
  ('md_boost', 'Broadening Options and Opportunities for Students Today (BOOST)', 'MD', 'Maryland State Department of Education',
   null, 'annual', 'Reapply each year; renewing students within the income limit receive priority as funding allows', '["award_letter", "income_tax_return"]'::jsonb,
   'csv', 'https://marylandpublicschools.org/pages/boost/index.aspx', true, null,
   'voucher', 'active', 'BOOST award letter', true,
   'BOOST award letter', 'medium'),
  ('tx_esa', 'Texas Education Freedom Accounts', 'TX', 'Texas Comptroller of Public Accounts',
   30000.0, 'quarterly', 'Automatic, participants in good standing only confirm they wish to continue', '["award_letter"]'::jsonb,
   'csv', 'https://educationfreedom.texas.gov/', true, null,
   'esa', 'active', null, true,
   'award letter; school confirms enrollment in the Odyssey portal', 'high'),
  ('ok_pctc', 'Oklahoma Parental Choice Tax Credit', 'OK', 'Oklahoma Tax Commission',
   7500.0, 'annual', 'New application required for each student every year', '["award_letter"]'::jsonb,
   'csv', 'https://oklahoma.gov/tax/individuals/parental-choice-tax-credit.html', true, null,
   'refundable_tax_credit', 'active', 'Enrollment Verification Number', true,
   'enrollment agreement with tuition and fees; request for Enrollment Verification Number; OTC approval notice', 'high'),
  ('ok_lnh', 'Lindsey Nicole Henry Scholarship for Students with Disabilities', 'OK', 'Oklahoma State Department of Education',
   null, 'quarterly', 'Renewal application each year, deadline generally December 1', '["award_letter", "iep_or_504"]'::jsonb,
   'csv', 'https://oklahoma.gov/education/services/school-choice/lnh-scholarship.html', true, null,
   'voucher', 'active', null, true,
   'LNH award letter; current IEP or eligibility documentation; enrollment agreement', 'medium'),
  ('ok_eoes', 'Oklahoma Equal Opportunity Education Scholarship', 'OK', 'Oklahoma Tax Commission with approved scholarship granting organizations',
   null, 'annual', 'Reapply each year with the scholarship granting organization', '["award_letter"]'::jsonb,
   'csv', 'https://oklahoma.gov/tax.html', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'SGO award letter; proof of income eligibility', 'low'),
  ('mo_moscholars', 'MOScholars Missouri Empowerment Scholarship Accounts Program', 'MO', 'Missouri State Treasurer with approved educational assistance organizations',
   null, 'quarterly', 'Reapply each year through the educational assistance organization', '["award_letter"]'::jsonb,
   'csv', 'https://treasurer.mo.gov/moscholars', true, null,
   'esa', 'active', null, true,
   'EAO award letter; enrollment agreement', 'medium'),
  ('ks_lisp', 'Kansas Tax Credit for Low Income Students Scholarship Program', 'KS', 'Kansas State Department of Education',
   8000.0, 'semester', 'Reapply each year through the scholarship granting organization while income eligible', '["award_letter"]'::jsonb,
   'csv', 'https://www.ksde.gov/Agency/Division-of-Learning-Services/Special-Education-and-Title-Services/Tax-Credit-for-Low-Income-Students-Scholarship-Program', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'scholarship granting organization award letter; proof of income eligibility', 'medium'),
  ('ne_opportunity_scholarships', 'Nebraska Opportunity Scholarships Act LB753', 'NE', 'Nebraska Department of Revenue',
   null, 'annual', 'Repealed in 2024 and replaced by LB1402, no renewals', '["award_letter"]'::jsonb,
   'csv', 'https://revenue.nebraska.gov/', false, null,
   'tax_credit_scholarship', 'repealed', null, false,
   'award letter', 'medium'),
  ('ne_education_scholarships', 'Nebraska Education Scholarships Act LB1402', 'NE', 'Nebraska State Treasurer',
   null, 'annual', 'Repealed by voters in the November 2024 referendum, no renewals', '["award_letter"]'::jsonb,
   'csv', 'https://treasurer.nebraska.gov/', false, null,
   'voucher', 'repealed', null, false,
   'award letter', 'medium'),
  ('sd_partners_in_education', 'South Dakota Partners in Education Tax Credit Program', 'SD', 'South Dakota Department of Revenue with approved scholarship granting organizations',
   null, 'annual', 'Reapply each year through the scholarship granting organization', '["award_letter"]'::jsonb,
   'csv', 'https://dor.sd.gov/', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'scholarship granting organization award letter; proof of income eligibility', 'medium'),
  ('ut_fits_all', 'Utah Fits All Scholarship Program', 'UT', 'Utah State Board of Education, program manager Odyssey',
   8000.0, 'annual', 'Reapply each spring by May 31 and submit portfolio or assessment results', '["award_letter"]'::jsonb,
   'csv', 'https://www.schools.utah.gov/utahfitsallscholarship', true, null,
   'esa', 'active', null, true,
   'award letter', 'high'),
  ('ut_carson_smith_opp', 'Carson Smith Opportunity Scholarship', 'UT', 'Utah State Board of Education via contracted Scholarship Granting Organization',
   null, 'annual', 'Reapply annually with the SGO, award scaled to family income', '["award_letter"]'::jsonb,
   'csv', 'https://www.schools.utah.gov/specialeducation/programs/specialneedsscholarshipgrants', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'award letter', 'medium'),
  ('ut_carson_smith_legacy', 'Carson Smith Special Needs Scholarship Program', 'UT', 'Utah State Board of Education',
   null, 'annual', 'Closed to new students, continuing students renew until they exit', '["award_letter"]'::jsonb,
   'csv', 'https://www.schools.utah.gov/specialeducation/programs/specialneedsscholarshipgrants', false, null,
   'voucher', 'inactive', null, false,
   'award letter', 'low'),
  ('mt_tcs', 'Montana Tax Credit Scholarship Program, Tax Credits for Contributions to Student Scholarship Organizations', 'MT', 'Montana Department of Revenue with approved Student Scholarship Organizations',
   null, 'annual', 'Reapply annually with the Student Scholarship Organization', '["award_letter"]'::jsonb,
   'csv', 'https://mtrevenue.gov/publications/tax-credits-for-qualified-education-contributions-guide/', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'award letter', 'medium'),
  ('mt_esa_sn', 'Montana Special Needs Equal Opportunity Education Savings Account Program', 'MT', 'Montana Office of Public Instruction',
   null, 'monthly', 'Account continues to age 24, application windows open May 1 and November 1', '["award_letter", "iep_or_504"]'::jsonb,
   'csv', 'https://opi.mt.gov/Families-Students/Parent-Resources/Education-Savings-Account', true, null,
   'esa', 'active', null, true,
   'award letter', 'medium'),
  ('wy_steamboat', 'Steamboat Legacy Scholarship Act Education Savings Account', 'WY', 'Wyoming Department of Education, platform vendor Odyssey',
   7000.0, 'quarterly', 'Returning families complete a prepopulated annual application each year', '["award_letter"]'::jsonb,
   'csv', 'https://edu.wyoming.gov/parents/education-savings-accounts/', true, null,
   'esa', 'active', null, true,
   'award letter', 'high'),
  ('id_pctc', 'Idaho Parental Choice Tax Credit', 'ID', 'Idaho State Tax Commission',
   7500.0, 'annual', 'Apply each tax year, returning families get priority starting 2027', '["award_letter"]'::jsonb,
   'csv', 'https://www.edchoice.org/school-choice/programs/idaho-parental-choice-tax-credit/', true, null,
   'refundable_tax_credit', 'active', null, true,
   'award letter', 'medium'),
  ('nv_ecsp', 'Nevada Educational Choice Scholarship Program, Opportunity Scholarship', 'NV', 'Nevada Department of Education with registered Scholarship Granting Organizations',
   10367.0, 'annual', 'Reapply annually with the SGO, renewals prioritized while funding lasts', '["award_letter"]'::jsonb,
   'csv', 'https://doe.nv.gov/offices/office-of-student-and-school-supports/private-schools/nevada-educational-choice-scholarship-program-opportunity-scholarship', true, null,
   'tax_credit_scholarship', 'active', 'AAA ID', true,
   'award letter; AAA ID', 'high'),
  ('nv_esa_2015', 'Nevada Education Savings Account Program', 'NV', 'Nevada State Treasurer',
   null, 'annual', 'Never funded, repealed in 2019, no renewal', '["award_letter"]'::jsonb,
   'csv', 'https://www.edchoice.org/state/nevada/', false, null,
   'esa', 'repealed', null, false,
   'award letter', 'low'),
  ('pa_eitc', 'Educational Improvement Tax Credit Program - Scholarship Organizations', 'PA', 'Pennsylvania Department of Community and Economic Development, Tax Credit Division',
   null, 'annual', 'Reapply to the scholarship organization each year, income reverified', '["award_letter"]'::jsonb,
   'csv', 'https://dced.pa.gov/programs/educational-improvement-tax-credit-program-eitc', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'scholarship organization award letter; household income documentation; school enrollment application', 'medium'),
  ('pa_ostc', 'Opportunity Scholarship Tax Credit Program', 'PA', 'Pennsylvania Department of Community and Economic Development, Tax Credit Division',
   15000.0, 'annual', 'Reapply to the opportunity scholarship organization each year', '["award_letter"]'::jsonb,
   'csv', 'https://dced.pa.gov/programs/opportunity-scholarship-tax-credit-program-ostc', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'opportunity scholarship organization award letter; proof of address in a low-achieving school attendance zone; income documentation', 'medium'),
  ('nh_efa', 'Education Freedom Account Program', 'NH', 'New Hampshire Department of Education, administered by Children''s Scholarship Fund New Hampshire with ClassWallet',
   null, 'quarterly', 'Reapply yearly, sign the program agreement and file the Record of Educational Attainment by 15 July', '["award_letter"]'::jsonb,
   'csv', 'https://nh.scholarshipfund.org/apply/nh-education-freedom-accounts/', true, null,
   'esa', 'active', null, true,
   'EFA award notification from Children''s Scholarship Fund NH; ClassWallet direct-pay or reimbursement order; school invoice', 'medium'),
  ('nh_etc', 'Education Tax Credit Scholarship Program', 'NH', 'New Hampshire Department of Revenue Administration, scholarships awarded by Children''s Scholarship Fund New Hampshire',
   null, 'annual', 'Reapply each spring, invited by email at the end of April', '["award_letter"]'::jsonb,
   'csv', 'https://nh.scholarshipfund.org/apply/nh-education-tax-credit-scholarships/', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'scholarship award letter from Children''s Scholarship Fund NH; proof of household income under 300 percent of the federal poverty level', 'medium'),
  ('nh_town', 'New Hampshire Town Tuitioning Program', 'NH', 'New Hampshire State Board of Education and the sending school district school board',
   null, 'annual', 'Continues while the student resides in a town with no district school for that grade', '["district_tuition_authorisation"]'::jsonb,
   'csv', 'http://www.gencourt.state.nh.us/rsa/html/xv/193/193-mrg.htm', true, null,
   'town_tuitioning', 'active', 'sending school district tuition contract approved by the school board', true,
   'sending district tuition contract or authorization; proof of residence in the tuitioning town; enrollment application', 'medium'),
  ('nh_ecca', 'Educational Choice for Children Act federal scholarship tax credit, New Hampshire participation', 'NH', 'IRS with scholarship granting organizations listed by the State of New Hampshire',
   null, 'annual', 'Reapply to a listed scholarship granting organization each year, credit effective 1 January 2027', '["award_letter"]'::jsonb,
   'csv', 'https://www.edchoice.org/federal-tax-credit-for-scholarships/', false, null,
   'tax_credit_scholarship', 'launching', null, false,
   'award letter', 'low'),
  ('vt_town', 'Vermont Town Tuitioning Program', 'VT', 'Vermont Agency of Education and the sending school district',
   null, 'annual', 'Continues yearly while resident in a non-operating district, subject to approved independent school status', '["district_tuition_authorisation"]'::jsonb,
   'csv', 'https://education.vermont.gov/accountability-data/financial-reports/tuition-rates', true, null,
   'town_tuitioning', 'active', 'sending school district tuition authorization approved by the superintendent', true,
   'sending district tuition authorization; proof of residence in a district that does not operate the grade; enrollment application', 'medium'),
  ('me_town', 'Maine Town Tuitioning Program', 'ME', 'Maine Department of Education and the sending school administrative unit',
   null, 'annual', 'Continues yearly while resident in a town that neither operates nor contracts for the grade', '["district_tuition_authorisation"]'::jsonb,
   'csv', 'https://www.maine.gov/doe/schools/schoolops/enrollment', true, null,
   'town_tuitioning', 'active', 'superintendent approval of tuition placement from the sending school administrative unit', true,
   'superintendent or SAU tuition approval; proof of residence in the sending town; enrollment application', 'medium'),
  ('ri_sgo', 'Tax Credits for Contributions to Scholarship Organizations', 'RI', 'Rhode Island Division of Taxation with approved scholarship organizations',
   null, 'annual', 'Reapply to the scholarship organization each year', '["award_letter"]'::jsonb,
   'csv', 'https://webserver.rilegislature.gov/Statutes/TITLE44/44-62/INDEX.htm', true, null,
   'tax_credit_scholarship', 'active', null, true,
   'scholarship organization award letter; proof of household income under 250 percent of the federal poverty level', 'medium'),
  ('dc_osp', 'DC Opportunity Scholarship Program', 'DC', 'Serving Our Children, under a grant from the U.S. Department of Education',
   15000.0, 'semester', 'Reapply each year, renewal income limit 300 percent of the federal poverty level', '["school_placement_form"]'::jsonb,
   'csv', 'https://servingourchildrendc.org/our-program/how-it-works/', true, null,
   'voucher', 'active', 'School Placement Form, known as the SPF', true,
   'School Placement Form; scholarship checks endorsed by the guardian; signed Invoice Confirmation Report', 'high'),
  ('ak_correspondence', 'Alaska Statewide Correspondence School Student Allotments', 'AK', 'Alaska Department of Education and Early Development with local correspondence school districts',
   null, 'annual', 'Annual re-enrollment and a new Individual Learning Plan; allotments stayed active after the Alaska Supreme Court reversal of March 2025, private tuition use still on remand', '["individual_learning_plan"]'::jsonb,
   'csv', 'https://education.alaska.gov', true, null,
   'esa', 'active', 'Individual Learning Plan', true,
   'approved Individual Learning Plan; district purchase order or vendor invoice request; correspondence enrollment verification', 'medium'),
  ('us_25f', 'Federal Scholarship Tax Credit, Internal Revenue Code Section 25F, Educational Choice for Children Act', 'US', 'Internal Revenue Service with state-designated scholarship granting organizations',
   null, 'annual', 'Reapply to the SGO each school year; credits first claimable 1 January 2027 for 2027-28, and 30 states had opted in as of 27 September 2026', '["award_letter"]'::jsonb,
   'csv', 'https://www.irs.gov/government-entities/federal-state-local-governments/federal-scholarship-tax-credit-fstc', false, null,
   'tax_credit_scholarship', 'launching', null, false,
   'SGO scholarship award letter; proof of household income; proof of student enrollment', 'high')
on conflict (program_code) do update set
  program_name            = excluded.program_name,
  state_code              = excluded.state_code,
  funding_agency          = excluded.funding_agency,
  maximum_award           = excluded.maximum_award,
  payment_schedule        = excluded.payment_schedule,
  renewal_rules           = excluded.renewal_rules,
  required_documents      = excluded.required_documents,
  website                 = excluded.website,
  is_active               = excluded.is_active,
  program_type            = excluded.program_type,
  program_status          = excluded.program_status,
  family_identifier_label = excluded.family_identifier_label,
  family_selectable       = excluded.family_selectable,
  documents_note          = excluded.documents_note,
  research_confidence     = excluded.research_confidence,
  updated_at              = now();

-- The four Step Up programmes migration 322 created already carry the right
-- names and codes. They gain the new columns and nothing else. They stay
-- family_selectable = false because a Florida family answers
-- `fl_scholarship_program` in the Florida section, not the out-of-state one.

update public.funding_program_catalog set
  program_type = 'tax_credit_scholarship', program_status = 'active', family_identifier_label = 'Award ID',
  family_selectable = false, maximum_award = coalesce(maximum_award, 12217.0),
  renewal_rules = coalesce(renewal_rules, 'Annual. Renewal students must confirm or decline by June 15, 2026 for full-year funding; new students by July 15, 2026. Enrollment verified by September 30 gets 100% funding; by January 15, 50%.'),
  documents_note = 'The Award ID; approval of enrollment in EMA (the parent must approve enrollment and then approve each quarterly invoice within 30 calendar days or it auto-deletes). Step Up''s application (not the school''s) collects proof of Florida residency, proof of the student''s age/birth date, and, where a priority category is claimed, income documentation (prior-year tax return, W-2s, or SNAP/TANF/Medicaid documentation) or foster/out-of-home care documentation. Schools are explicitly prohibited from requesting the parent''s EMA login credentials.', research_confidence = 'high - 2026-27 amounts, school requirements and the "Award ID" term all verified on official Step Up and FDOE pages.',
  website = coalesce(nullif(website, ''), 'https://www.stepupforstudents.org/scholarships/private-school/'), updated_at = now()
where program_code = 'FTC';
update public.funding_program_catalog set
  program_type = 'voucher', program_status = 'active', family_identifier_label = 'Award ID',
  family_selectable = false, maximum_award = coalesce(maximum_award, 12217.0),
  renewal_rules = coalesce(renewal_rules, 'Annual - same June 15 / July 15, 2026 confirmation deadlines as FTC.'),
  documents_note = 'Same as FTC - Award ID and EMA enrollment approval. FES-EO and FTC share a single application and a single award-priority queue: renewals first, then households at or below 185% FPL / foster / out-of-home care, then 185-400% FPL, then all others regardless of income.', research_confidence = 'high',
  website = coalesce(nullif(website, ''), 'https://www.stepupforstudents.org/scholarships/private-school/'), updated_at = now()
where program_code = 'FES-EO';
update public.funding_program_catalog set
  program_type = 'esa', program_status = 'active', family_identifier_label = 'Award ID',
  family_selectable = false, maximum_award = coalesce(maximum_award, 10000.0),
  renewal_rules = coalesce(renewal_rules, 'Annual confirmation through EMA; same seasonal cycle as the other private-school scholarships.'),
  documents_note = 'Award ID and EMA enrollment approval. Eligibility documentation goes to Step Up, not the school: proof of one of ~23 named qualifying diagnoses or conditions (autism, Down syndrome, cerebral palsy, intellectual disability, specific learning disability, speech impairment, hearing or visual impairment, spina bifida, traumatic brain injury, etc.), evidenced by a current IEP from a Florida school district, or a matrix of services form, or a diagnosis from a licensed physician or psychologist. Students are ages 3-22.', research_confidence = 'medium-high - program, eligibility and mechanism verified on Step Up (Sept 2026); I did not open the separate 2026-27 FES-UA county award table, so the "about $10,000" figure is Step Up''s own stated average rather than a specific 2026-27 line item.',
  website = coalesce(nullif(website, ''), 'https://www.stepupforstudents.org/scholarships/unique-abilities/'), updated_at = now()
where program_code = 'FES-UA';
update public.funding_program_catalog set
  program_type = 'esa', program_status = 'active', family_identifier_label = 'Award ID',
  family_selectable = false, maximum_award = coalesce(maximum_award, 12217.0),
  renewal_rules = coalesce(renewal_rules, 'Annual. The 2026-27 deadline for both new and renewing students was April 30, 2026. 2027-28 interest list is open.'),
  documents_note = 'Largely not applicable for full-time private school admission - PEP is for students NOT enrolled full time in a public or private school. A private school can only be a part-time or à la carte provider to a PEP student. Family must be a Florida resident (or active-duty military with Florida PCS orders / Florida home of record), student at least 5 by Sept 1 and under 21.', research_confidence = 'high',
  website = coalesce(nullif(website, ''), 'https://www.stepupforstudents.org/scholarships/personalized-education-program/'), updated_at = now()
where program_code = 'FTC-PEP';

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- 'total'            : 91 rows - the 89 here plus fl_esa and fl_step_up, which
--                      are Florida's funder recorded as a programme. They are
--                      left alone; nothing offers them to a parent.
--                      If you see 94, this is the first run and it created
--                      three duplicates before 441 merged them. Run 441.
-- 'offered to family': 63. These are the options the out-of-state scholarship
--                      question puts in front of a parent, one state at a time.
-- 'publishes an ID'  : the short list of programmes where asking a family for
--                      an award number is a fair question.
-- 'by state'         : one row per state, so a state you expected and do not
--                      see here is a state with no programme. GA reads 0 of 3
--                      and FL 0 of 8: those families answer their own
--                      sections, not the out-of-state one.

select 'total'::text as finding, count(*)::text as detail, ''::text as detail_2
  from public.funding_program_catalog
union all
select 'offered to family', count(*)::text, ''
  from public.funding_program_catalog where family_selectable
union all
select 'publishes an ID', program_code, family_identifier_label
  from public.funding_program_catalog
 where family_identifier_label is not null and family_selectable
union all
select 'by state', state_code,
       count(*) filter (where family_selectable)::text || ' of ' || count(*)::text || ' offered'
  from public.funding_program_catalog
 group by state_code
order by 1, 2;

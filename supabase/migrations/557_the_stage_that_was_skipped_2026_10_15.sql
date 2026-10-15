-- ============================================================================
-- 557  THE STAGE THAT WAS SKIPPED
--      15 October 2026
-- ============================================================================
--
-- JIMMY, 15 OCTOBER 2026:
--
--   "beginning with the inquiry email and each time a school leader receives
--    an email there always needs to be a button that says 'skip next stage' -
--    this is in addition to whatever button/decision is already there. this
--    skip next stage button should do exactly that and the school leader
--    should then receive the next email in the admissions flow stages that we
--    have laid out"
--
-- and, when asked what he was actually trying to achieve:
--
--   "a parent has complete the inquiry form, and then goes through the other
--    stages but the school leader doesn't do the shadow days and just move to
--    acceptance. this is just an example but can happen at any stage except
--    the inquiry"
--
-- ── WHAT THIS FILE DOES AND DOES NOT DO ─────────────────────────────────────
--
-- It adds two columns and one paragraph to five letters. It does not add a
-- letter. THERE IS NO NEW LETTER IN THIS WORK AT ALL, and that is worth
-- writing down because for an hour this morning I was sure there had to be.
--
-- occasionForStage() in automation/post-call.ts already decides which buttons
-- a school leader is shown FROM THE CHILD'S STAGE, and all three "Record your
-- notes" letters point at that one page with that one token. So the leader's
-- buttons are a function of where the child is:
--
--   New Inquiry .. Interest Meeting Held   Send the tour request   (GA, FL)
--                                          Send the shadow day invite (HS, V)
--   Tour Scheduled / Completed             Send the application
--   Shadow Days Scheduled / Completed      Accept - send email
--                                          Deny - send email
--
-- Moving a child one rung up that ladder and re-sending the notes letter for
-- the rung she lands on IS the whole feature. Every letter it needs is
-- written, approved and live.
--
-- ── WHY THE LADDER IS DRIVEN BY THE STEP NUMBER, NOT THE OCCASION ───────────
--
-- occasionForStage('application_submitted') returns 'interest_meeting',
-- because it only names the tour and shadow-day stages and everything else
-- falls through. An occasion-driven skip would therefore have taken a child
-- at Application Submitted - who has toured and applied - and landed her back
-- at the tour. That is Jimmy's own example arriving at the wrong end of the
-- flow.
--
-- So the ladder reads LEAD_STAGES.step, which is written down rather than
-- computed for exactly this kind of reason, and its own comment says so.
--
-- ── skipped_stages, AND WHY NOT JUST THE HISTORY TABLE ──────────────────────
--
-- admissions_lead_stage_history already records every move and who made it,
-- so the jump itself was always going to be auditable. Jimmy was offered that
-- and chose otherwise:
--
--   "The card says the stage was skipped"
--
-- The reason it matters: the stage the Accept/Deny page reads is
-- shadow_day_completed, labelled "Shadow Days Completed" on the board. A
-- child whose shadow days were skipped would have a card claiming days that
-- nobody attended. This build has been punished more than once this week for
-- writing a plausible fact in place of a true one, and a card is read by
-- people who were not in the room.
--
-- ── THE TOKEN IS DEFAULTED, NOT MINTED ──────────────────────────────────────
--
-- post_call_token is minted lazily by mintPostCallToken() in chase/run.ts, and
-- it shows: 13 of 358 leads hold one. The skip button has to be on the
-- inquiry notice, which is the first letter of all, so a lazily minted token
-- would be absent exactly where it is first needed.
--
-- A column default does it with no code: 64 lowercase hex characters, which is
-- the shape TOKEN_PATTERN in post-call.ts and call-token.ts both insist on
-- BEFORE they touch the database. pgcrypto lives in the extensions schema here
-- (checked, version 1.3), so it is called by that name.
--
-- ============================================================================

begin;

-- ── THE GUARD, BEFORE ──────────────────────────────────────────────────────

do $$
declare
  n_cols integer;
  n_let  integer;
begin
  select count(*) into n_cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'admissions_leads'
    and column_name in ('skipped_stages', 'skip_stage_token');
  if n_cols <> 0 then
    raise exception 'Refusing: % of the two columns already exist. This has run.', n_cols;
  end if;

  -- THE FIVE LETTERS, BY NAME, AND NONE MAY ALREADY CARRY THE BUTTON.
  select count(*) into n_let
  from public.admissions_communication_templates
  where template_key in ('inquiry_staff_alert',
                         'staff_interest_meeting_booked',
                         'staff_record_meeting_notes',
                         'staff_record_tour_notes',
                         'decision_gate_staff_email')
    and body like '%{{skip_stage_link}}%';
  if n_let <> 0 then
    raise exception 'Refusing: % letter(s) already carry {{skip_stage_link}}.', n_let;
  end if;
end $$;

-- ── THE COLUMNS ────────────────────────────────────────────────────────────

alter table public.admissions_leads
  add column skipped_stages text[] not null default '{}'::text[];

comment on column public.admissions_leads.skipped_stages is
  'Lead stages this child was moved past by Skip next stage rather than through. The board marks the current stage as skipped when it appears here. Written only by skipStage() in src/lib/admissions/automation/skip-stage.ts.';

alter table public.admissions_leads
  add column skip_stage_token text
    default encode(extensions.gen_random_bytes(32), 'hex');

comment on column public.admissions_leads.skip_stage_token is
  'The 64-hex token behind Skip next stage in a school leader letter. Defaulted rather than minted, because the button is on the inquiry notice and a lazily minted token is absent exactly where it is first needed.';

-- Every lead that already exists, including the archived ones: an archived
-- lead can be restored, and a restored lead with a null token has a dead
-- button in every letter it was ever sent.
update public.admissions_leads
   set skip_stage_token = encode(extensions.gen_random_bytes(32), 'hex')
 where skip_stage_token is null;

alter table public.admissions_leads
  alter column skip_stage_token set not null;

-- ONE LEAD PER TOKEN. The lookup is .eq("skip_stage_token", token).maybeSingle(),
-- which throws rather than guesses if two rows ever answered to one token.
create unique index admissions_leads_skip_stage_token_key
  on public.admissions_leads (skip_stage_token);

-- ── THE PARAGRAPH, IN FIVE LETTERS ─────────────────────────────────────────
--
-- The label is NOT in here. BUTTON_LABELS in letter-html.ts is keyed by merge
-- field and supplies "Skip next stage", so the wording changes in one line
-- without a migration - the rule argued out over application_link on
-- 13 October and over all four booking buttons this morning.
--
-- inquiry_staff_alert is the one letter of the five whose body is HTML, and it
-- carries its own anchor, as its existing interest_link_action line does.

update public.admissions_communication_templates
   set body = body || '<p><a href="{{skip_stage_link}}">Skip next stage</a></p>',
       updated_at = now()
 where template_key = 'inquiry_staff_alert';

update public.admissions_communication_templates
   set body = body || E'\r\n\r\n{{skip_stage_link}}',
       updated_at = now()
 where template_key in ('staff_interest_meeting_booked',
                        'staff_record_meeting_notes',
                        'staff_record_tour_notes',
                        'decision_gate_staff_email');

-- ── THE GUARDS, AFTER ──────────────────────────────────────────────────────

do $$
declare
  n_have  integer;
  n_null  integer;
  n_short integer;
  n_extra integer;
begin
  select count(*) into n_have
  from public.admissions_communication_templates
  where body like '%{{skip_stage_link}}%';
  if n_have <> 5 then
    raise exception 'Refusing: the button landed in % letter(s), expected 5.', n_have;
  end if;

  -- IT MUST NOT BE ON THE TWO JIMMY KEPT IT OFF. staff_record_shadow_day_notes
  -- is the Accept/Deny letter - "no skip button here" - and
  -- staff_application_accepted comes after the decision, where the only stage
  -- left is Enrolled and that is where the fee and the contract hang.
  select count(*) into n_extra
  from public.admissions_communication_templates
  where template_key in ('staff_record_shadow_day_notes',
                         'staff_application_accepted',
                         'staff_shadow_day_booked',
                         'staff_new_inquiry')
    and body like '%{{skip_stage_link}}%';
  if n_extra <> 0 then
    raise exception 'Refusing: the button reached % letter(s) it must not be on.', n_extra;
  end if;

  select count(*) into n_null
  from public.admissions_leads
  where skip_stage_token is null;
  if n_null <> 0 then
    raise exception 'Refusing: % lead(s) have no skip token.', n_null;
  end if;

  -- THE SHAPE THE PAGE WILL INSIST ON, CHECKED HERE RATHER THAN DISCOVERED
  -- THERE. A token that fails TOKEN_PATTERN does not return an error from
  -- that page - it returns null, deliberately, and the leader is told the
  -- link is not valid with no clue why.
  select count(*) into n_short
  from public.admissions_leads
  where skip_stage_token !~ '^[0-9a-f]{64}$';
  if n_short <> 0 then
    raise exception 'Refusing: % token(s) are not 64 lowercase hex characters.', n_short;
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

select template_key,
       right(replace(body, E'\r\n', ' '), 90) as how_each_letter_now_ends
from public.admissions_communication_templates
where body like '%{{skip_stage_link}}%'
order by template_key;

select count(*) as leads,
       count(skip_stage_token) as with_token,
       count(distinct skip_stage_token) as distinct_tokens,
       count(*) filter (where cardinality(skipped_stages) > 0) as with_a_skipped_stage
from public.admissions_leads;

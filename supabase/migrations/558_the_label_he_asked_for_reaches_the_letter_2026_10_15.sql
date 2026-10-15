-- ============================================================================
-- 558  THE LABEL HE ASKED FOR REACHES THE LETTER
--      15 October 2026
-- ============================================================================
--
-- JIMMY, 15 OCTOBER 2026, reviewing the email mockups, listing four buttons:
--
--   "not choose - schedule your shadow days, choose your tour time to -
--    schedule your tour, choose your time to - schedule your time, send the
--    link to - send schedule interest meeting/conversation link"
--
-- Three of the four landed in 3c908c8e. THE FOURTH DID NOT, and it took a
-- render to find out - the subject of the test file shipped in 7444f92d.
--
-- ── WHY THE CODE CHANGE WAS NOT ENOUGH ──────────────────────────────────────
--
-- BUTTON_LABELS.interest_link_action was set to his words and shipped. It
-- never reaches him, because inquiry_staff_alert writes its own anchor:
--
--   <p><a href="{{interest_link_action}}">Send them the interest meeting link</a></p>
--
-- and letter-html keeps an author's anchor text on purpose - "a link somebody
-- wrote an anchor around is a decision", argued out on 10 October when the
-- opposite rule turned a deliberately plain link into a button.
--
-- So the label is right in the code and wrong in the inbox. ONLY THE LETTER
-- CAN FIX THE LETTER.
--
-- ── WHY NOT DELETE THE ANCHOR AND LET THE LABEL APPLY ───────────────────────
--
-- That was the first idea and it is the wrong one. This body is HTML, and for
-- an HTML body the buttons are made by buttonsForSoleAnchorParagraphs, which
-- promotes a paragraph whose only content is an ANCHOR. A bare
-- {{interest_link_action}} in a <p> is not an anchor, so removing it would not
-- produce a button with the right words - it would produce a naked URL in a
-- letter that has carried a button since September.
--
-- One line of anchor text, then. BUTTON_LABELS.interest_link_action stays as
-- it is and now agrees with what the leader reads, which is the point.
--
-- ── WHAT THIS DOES NOT TOUCH ────────────────────────────────────────────────
--
-- Not the href. Not the subject. Not the skip button 557 added to the end of
-- this same letter, which is checked for below - two changes to one letter in
-- one evening is exactly when a careless replace() eats the other one.
--
-- ============================================================================

begin;

-- ── THE GUARD, BEFORE ──────────────────────────────────────────────────────

do $$
declare
  n_old  integer;
  n_skip integer;
begin
  select count(*) into n_old
  from public.admissions_communication_templates
  where template_key = 'inquiry_staff_alert'
    and body like '%>Send them the interest meeting link</a>%';
  if n_old <> 1 then
    raise exception
      'Refusing: expected 1 row with the old anchor text, found %. It may already have run.', n_old;
  end if;

  -- 557'S BUTTON MUST BE HERE BEFORE, SO ITS ABSENCE AFTER IS THIS FILE'S FAULT.
  select count(*) into n_skip
  from public.admissions_communication_templates
  where template_key = 'inquiry_staff_alert'
    and body like '%{{skip_stage_link}}%';
  if n_skip <> 1 then
    raise exception 'Refusing: migration 557''s skip button is not on this letter.';
  end if;
end $$;

-- ── THE EDIT ───────────────────────────────────────────────────────────────

update public.admissions_communication_templates
   set body = replace(
         body,
         '>Send them the interest meeting link</a>',
         '>Send schedule interest meeting/conversation link</a>'
       ),
       updated_at = now()
 where template_key = 'inquiry_staff_alert';

-- ── THE GUARDS, AFTER ──────────────────────────────────────────────────────

do $$
declare
  r record;
begin
  select * into r
  from public.admissions_communication_templates
  where template_key = 'inquiry_staff_alert';

  if r.body not like '%>Send schedule interest meeting/conversation link</a>%' then
    raise exception 'Refusing: his words are not in the letter.';
  end if;
  if r.body like '%Send them the interest meeting link%' then
    raise exception 'Refusing: the old wording survived.';
  end if;

  -- EVERYTHING ELSE, WORD FOR WORD.
  if r.body not like '%href="{{interest_link_action}}"%' then
    raise exception 'Refusing: the button lost its link.';
  end if;
  if r.body not like '%{{skip_stage_link}}%' then
    raise exception 'Refusing: 557''s skip button was eaten by this edit.';
  end if;
  if r.body not like '%<strong>{{student_name}}</strong> — new inquiry at {{school_name}}.%' then
    raise exception 'Refusing: the opening line moved.';
  end if;
  if r.body not like '%This family has not heard from us yet.%' then
    raise exception 'Refusing: the sentence that stops a leader assuming we wrote is gone.';
  end if;
  if r.body not like '%Phone: <a href="tel:{{parent_phone_dial}}">{{parent_phone}}</a>%' then
    raise exception 'Refusing: the phone line from 556 moved.';
  end if;
  if r.subject <> 'New inquiry: {{student_name}} — {{school_name}}' then
    raise exception 'Refusing: the subject moved and this file must not touch it.';
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICATION - the letter as Nina will read it
-- ============================================================================

select template_key, subject, body
from public.admissions_communication_templates
where template_key = 'inquiry_staff_alert';

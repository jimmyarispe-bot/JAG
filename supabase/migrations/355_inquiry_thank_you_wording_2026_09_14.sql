-- 355_inquiry_thank_you_wording_2026_09_14.sql
--
-- Three sentences in the inquiry thank-you, rewritten by Jimmy after reading one
-- that had actually arrived.
--
--   1. "Please pick a time that suits you:"
--      -> "Please pick a time that suits you by clicking the following link:"
--
--      The link sits on its own line below. Saying so removes the half-second
--      where a parent wonders whether something is missing.
--
--   2. "We will use it to hear about {{student_name}} in your own words"
--      -> "We will use this time together to learn about {{student_name}} in
--          your own words"
--
--      "it" referred to a conversation mentioned two paragraphs earlier, with a
--      booking link in between. "This time together" says what is being offered.
--
--   3. "If none of those times work, simply reply to this email."
--      -> "If none of those times work, simply reply to this email and let me
--          know."
--
-- WHAT IS NOT CHANGING. The greeting stays "Dear {{parent_name}}" — asked and
-- answered before writing this, rather than tidied on the way past. The subject
-- is untouched. So is `inquiry_thank_you_email_no_link`, which is a different
-- message: no booking link, the campus contact makes the arrangements, and none
-- of the three sentences above exist in it.
--
-- WHY `replace` AND NOT A NEW BODY, the same reasoning as migration 347. These
-- bodies have been edited by several migrations since 233, so the version in the
-- database is not the version any single file shows. Rewriting the whole body
-- from a file would silently discard whatever those migrations did. An
-- insertion anchored on exact text changes only what it names.
--
-- The anchors below were read from migration 233 and confirmed against an email
-- that actually arrived on 13 September, so they are text that exists rather
-- than text that ought to. Migration 344 was the lesson: a guard pinned to an em
-- dash matched nothing and reported success.
--
-- RE-RUNNABLE: each update is guarded on the old text still being present and
-- the new text not being.

-- 1 -------------------------------------------------------------------------
update public.admissions_communication_templates
set body = replace(
      body,
      'Please pick a time that suits you:',
      'Please pick a time that suits you by clicking the following link:'
    ),
    updated_at = now()
where template_key = 'inquiry_thank_you_email'
  and channel = 'email'
  and body like '%Please pick a time that suits you:%'
  and body not like '%by clicking the following link%';

-- 2 -------------------------------------------------------------------------
update public.admissions_communication_templates
set body = replace(
      body,
      'We will use it to hear about {{student_name}} in your own words',
      'We will use this time together to learn about {{student_name}} in your own words'
    ),
    updated_at = now()
where template_key = 'inquiry_thank_you_email'
  and channel = 'email'
  and body like '%We will use it to hear about {{student_name}} in your own words%';

-- 3 -------------------------------------------------------------------------
update public.admissions_communication_templates
set body = replace(
      body,
      'If none of those times work, simply reply to this email.',
      'If none of those times work, simply reply to this email and let me know.'
    ),
    updated_at = now()
where template_key = 'inquiry_thank_you_email'
  and channel = 'email'
  and body like '%If none of those times work, simply reply to this email.%'
  and body not like '%reply to this email and let me know%';

-- ---------------------------------------------------------------------------
-- VERIFICATION. All three flags must be true on inquiry_thank_you_email.
--
-- A false means the anchor was not where it was read to be, that sentence still
-- says what it said before, and nothing should be assumed about the rest.
--
-- inquiry_thank_you_email_no_link is listed too, and its three flags should all
-- be FALSE — it is a different message and this migration must not have touched
-- it.
-- ---------------------------------------------------------------------------
select
  template_key,
  coalesce(school_id::text, 'global') as scope,
  is_active,
  body like '%by clicking the following link%'            as has_link_sentence,
  body like '%We will use this time together to learn%'   as has_time_together,
  body like '%reply to this email and let me know%'       as has_reply_sentence,
  body
from public.admissions_communication_templates
where trigger_event = 'inquiry_submitted'
  and channel = 'email'
order by template_key;

-- 535_two_letters_nobody_had_written_2026_10_10.sql
--
-- NO CODE CHANGE. Run whenever. Both letters are live before and after;
-- only the words change.
--
-- ── WHAT THIS IS ────────────────────────────────────────────────────────────
--
-- Two of the seven letters that came with the platform in migration 068 as
-- placeholder examples, were never replaced, and have been reaching families
-- ever since. Jimmy read both side by side against replacements on
-- 10 October and answered: "yours are fine".
--
-- Both fire while a family is filling in the application, and neither was on
-- the flow chart until today.
--
-- ── 1. THE PORTAL WELCOME ───────────────────────────────────────────────────
--
-- Fires the moment the family presses Start Application.
--
--   was  Welcome to your application portal - {{student_name}}
--   now  {{student_name}}'s application is started
--
-- The subject named the software. A parent does not care that there is a
-- portal; they care that the thing they just started is their child's.
--
-- ── 2. THE DOCUMENTS CHASER ─────────────────────────────────────────────────
--
-- Fires each time a family uploads a document while checklist items remain.
--
-- THE FAULT WAS THE ORDER, NOT THE WORDING. A family uploads something and
-- the platform answers with a demand for more, with no sign that the thing
-- they just sent ever arrived. The new first line is the whole point of the
-- rewrite: "Thank you for the document you just sent. We have it."
--
-- ── WHAT BOTH GAINED ────────────────────────────────────────────────────────
--
-- A person. Every other family letter in this build is signed by
-- {{admissions_contact_name}} and invites a reply; these two ended on a bare
-- school name, which is how a letter tells somebody not to answer it.
--
-- All five merge tokens used here are in MERGE_FIELDS already -
-- student_name, guardian_first_name, school_name, portal_link, upload_link,
-- missing_documents, admissions_contact_name - so none of them can print
-- literal braces at a parent.
--
-- ONE NETWORK ROW EACH. Same words at all four campuses; no campus has
-- overridden either, and nothing here creates one.
--
-- Safe to re-run: each update is skipped when the body already matches, and
-- the report says so rather than claiming a change it did not make.

begin;

-- ── 1. application_started_email ─────────────────────────────────────────────

do $$
declare
  touched integer;
  v_subject text := '{{student_name}}''s application is started';
  v_body text :=
'Dear {{guardian_first_name}},

You have started {{student_name}}''s application to {{school_name}}.

Everything you enter is saved as you go, so you can stop and come back whenever it suits you:

{{portal_link}}

If you get stuck on a question or a document, reply to this email and it will reach me directly.

Warm regards,
{{admissions_contact_name}}
{{school_name}} Admissions';
begin
  update public.admissions_communication_templates
     set subject = v_subject, body = v_body, updated_at = now()
   where template_key = 'application_started_email'
     and (subject is distinct from v_subject or body is distinct from v_body);

  get diagnostics touched = row_count;
  raise notice 'portal welcome rows changed: %.', touched;
  if touched = 0 then
    raise notice 'portal welcome unchanged - already these words, or no such row.';
  end if;
end $$;

-- ── 2. missing_documents_email ───────────────────────────────────────────────

do $$
declare
  touched integer;
  v_subject text := 'A few documents still needed for {{student_name}}';
  v_body text :=
'Dear {{guardian_first_name}},

Thank you for the document you just sent for {{student_name}}. We have it.

There are still a few items we need before {{student_name}}''s application is complete:

{{missing_documents}}

You can upload them here: {{upload_link}}

If anything on that list is hard to get hold of, reply to this email and it will reach me directly — we will work it out.

Warm regards,
{{admissions_contact_name}}
{{school_name}} Admissions';
begin
  update public.admissions_communication_templates
     set subject = v_subject, body = v_body, updated_at = now()
   where template_key = 'missing_documents_email'
     and (subject is distinct from v_subject or body is distinct from v_body);

  get diagnostics touched = row_count;
  raise notice 'documents chaser rows changed: %.', touched;
  if touched = 0 then
    raise notice 'documents chaser unchanged - already these words, or no such row.';
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT four rows, every verdict reading 'correct'.
--
--   1  the portal welcome       subject names the child, not the portal
--   2  the portal welcome       signed by a person
--   3  the documents chaser     opens by saying the document arrived
--   4  the documents chaser     signed by a person
--
-- Anything reading '*** ... ***' means the update did not take and the live
-- letter is still the one that came with the platform.

select 1 as seq,
       'portal welcome: subject names the child' as check,
       case when subject = '{{student_name}}''s application is started'
            then 'correct' else '*** STILL THE OLD SUBJECT ***' end as verdict,
       subject as the_words
  from public.admissions_communication_templates
 where template_key = 'application_started_email'

union all

select 2, 'portal welcome: signed by a person',
       case when body like '%{{admissions_contact_name}}%'
            then 'correct' else '*** NO SIGN-OFF ***' end,
       coalesce(substring(body from 'If you get stuck.{0,70}'), '—')
  from public.admissions_communication_templates
 where template_key = 'application_started_email'

union all

select 3, 'documents chaser: says the document arrived',
       case when body like '%Thank you for the document you just sent%'
            then 'correct' else '*** STILL OPENS WITH A DEMAND ***' end,
       coalesce(substring(body from 'Thank you for the document.{0,60}'), '—')
  from public.admissions_communication_templates
 where template_key = 'missing_documents_email'

union all

select 4, 'documents chaser: signed by a person',
       case when body like '%{{admissions_contact_name}}%'
            then 'correct' else '*** NO SIGN-OFF ***' end,
       coalesce(substring(body from 'If anything on that list.{0,70}'), '—')
  from public.admissions_communication_templates
 where template_key = 'missing_documents_email'

 order by seq;

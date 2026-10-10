-- 536_scholarship_voucher_not_state_funding_2026_10_10.sql
--
-- NO CODE CHANGE. Run whenever. All four letters are live before and after;
-- only the words change.
--
-- The last four of the seven placeholder letters that came with the platform
-- in migration 068, were never replaced, and have been reaching families
-- ever since. 535 did the other two.
--
-- ── THE WORD ────────────────────────────────────────────────────────────────
--
-- Jimmy, 10 October: "change funding to scholarship/voucher".
--
-- "State funding" and "financial aid" are what the platform called it.
-- Neither is what a family calls it: in Georgia it is a GOAL scholarship, in
-- Florida it is a voucher, and "scholarship/voucher" is the pair of words
-- that covers both without making a parent work out which one we mean.
--
-- ── NO PROMISE ABOUT THE CHILD'S PLACE ──────────────────────────────────────
--
-- The rejection letter badly wants a reassuring sentence and the obvious one
-- is "this does not affect your child's place". It is not written, because
-- nobody has confirmed it is true, and a promise a school cannot keep is
-- worse in that letter than no promise at all. What is there instead -
-- "this is usually something small and fixable" - is about the paperwork,
-- which is a claim this build can stand behind.
--
-- ── NO NAME AT THE BOTTOM, DELIBERATELY ─────────────────────────────────────
--
-- Every other family letter is signed {{admissions_contact_name}} - the
-- campus school leader. These four are not, for two reasons that arrived
-- together on 10 October. Jimmy does this work himself ("5 n 6 are always
-- me"), and the four were taken out of the school-leader blind copy the same
-- morning because they are money. Signing Nina's name to a letter she will
-- never see would send a replying parent to somebody with no idea what they
-- are replying about.
--
-- ── THE INVERTED ONE ────────────────────────────────────────────────────────
--
-- financial_aid_requested_email fires from registerScholarshipDocument -
-- the moment a family UPLOADS their paperwork - and told them paperwork was
-- NEEDED. The submit event was wired to the request letter. It becomes an
-- acknowledgement, which is what that moment actually is.
--
-- STILL ONCE PER FILE. Three uploads, three thank-yous. Making it send once
-- per application is a code change and is not in this migration.
--
-- Safe to re-run: each update is skipped when the body already matches.

begin;

do $$
declare
  touched integer;
  total integer := 0;
  r record;
begin
  for r in
    select * from (values

      ('state_funding_needed_email',
       'Scholarship/voucher paperwork for {{student_name}}',
'Dear {{guardian_first_name}},

As you work through {{student_name}}''s application, there is one more piece we need — the paperwork for {{funding_program}}.

Please send us the award letter, the award amount, the award ID, and {{student_name}}''s state student ID.

You can upload it all here: {{upload_link}}

If you do not have every piece yet, send what you have and reply to this email to tell us what is missing.

Warm regards,
{{school_name}} Admissions'),

      ('financial_aid_requested_email',
       'We have {{student_name}}''s scholarship/voucher document',
'Dear {{guardian_first_name}},

Thank you — your scholarship/voucher document for {{student_name}} has reached us.

These are reviewed in the order they arrive, and we will contact you directly if anything further is needed.

There is nothing else for you to do right now.

Warm regards,
{{school_name}} Admissions'),

      ('funding_approved_email',
       '{{student_name}}''s scholarship/voucher is verified',
'Dear {{guardian_first_name}},

Good news — {{student_name}}''s scholarship/voucher has been verified.

Nothing further is needed from you on the scholarship/voucher side. Anything still outstanding on {{student_name}}''s application is waiting in your portal:

{{portal_link}}

If you have a question, reply to this email.

Warm regards,
{{school_name}} Admissions'),

      ('funding_rejected_email',
       '{{student_name}}''s scholarship/voucher — what we need next',
'Dear {{guardian_first_name}},

We were not able to verify {{student_name}}''s scholarship/voucher with the documents we have.

{{rejection_reason}}

This is usually something small and fixable.

You can upload corrected documents here: {{upload_link}}

If you are not sure what is being asked for, reply to this email and tell us — we would rather talk it through than have you guess.

Warm regards,
{{school_name}} Admissions')

    ) as t(template_key, subject, body)
  loop
    update public.admissions_communication_templates
       set subject = r.subject, body = r.body, updated_at = now()
     where template_key = r.template_key
       and (subject is distinct from r.subject or body is distinct from r.body);

    get diagnostics touched = row_count;
    total := total + touched;
    if touched = 0 then
      raise notice '% unchanged - already these words, or no such row.', r.template_key;
    end if;
  end loop;

  raise notice 'rows changed: % of 4.', total;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT five rows, every verdict reading 'correct'.
--
--   1-4  one per letter: the new word is in, the old one is out
--   5    COUNT letters still saying "state funding" or "financial aid" : 0

select 1 as seq, 'paperwork request' as letter,
       case when subject like 'Scholarship/voucher paperwork%' then 'correct'
            else '*** STILL THE OLD SUBJECT ***' end as verdict,
       subject as the_words
  from public.admissions_communication_templates
 where template_key = 'state_funding_needed_email'

union all
select 2, 'document acknowledgement',
       case when body like '%has reached us%' then 'correct'
            else '*** STILL ASKS FOR WHAT THEY JUST SENT ***' end,
       subject
  from public.admissions_communication_templates
 where template_key = 'financial_aid_requested_email'

union all
select 3, 'verified',
       case when subject like '%scholarship/voucher is verified' then 'correct'
            else '*** STILL THE OLD SUBJECT ***' end,
       subject
  from public.admissions_communication_templates
 where template_key = 'funding_approved_email'

union all
select 4, 'not verified',
       case when body like '%usually something small and fixable%' then 'correct'
            else '*** NO REASSURANCE ***' end,
       subject
  from public.admissions_communication_templates
 where template_key = 'funding_rejected_email'

union all
select 5, 'COUNT still saying state funding or financial aid',
       case when count(*) = 0 then 'correct'
            else '*** A LETTER STILL USES THE OLD WORDS ***' end,
       count(*)::text
  from public.admissions_communication_templates
 where template_key in ('state_funding_needed_email','financial_aid_requested_email',
                        'funding_approved_email','funding_rejected_email')
   and (subject || ' ' || body) ~* '(state funding|financial aid)'

 order by seq;

-- ===========================================================================
-- THE LAST DUPLICATE, AND THE INDEX 368 COULD NOT CREATE
-- 15 September 2026
-- ===========================================================================
--
-- 368 deleted every EXACT duplicate and then tried to add the unique index in
-- the same script. It could not: one pair remained whose two rows differ, and
-- 368 refuses to choose between differing copies — correctly, but the index
-- should have come after that choice rather than before it. That was a
-- sequencing mistake in 368, not a mistake in what it declined to delete.
--
-- THE PAIR
--
-- staff_application_submitted, network-wide, both active. It goes to the school
-- leader when a family finishes an application — not to a parent.
--
--   COPY 1  "Application submitted: {{student_name}}"
--           "Application submitted for {{student_name}} — ready for review."
--
--           One line. Seed data from 068.
--
--   COPY 2  "{{student_name}} has completed an application to {{school_name}}"
--           Carries {{lead_link}}, the parent's name, email and phone, and:
--           "Read it before you answer the shadow-days decision waiting for
--            you. What a family says about their child's greatness and
--            challenges is the reason they chose to tell us."
--
-- Copy 2 is kept. It is the one written for this school, and it is the only one
-- that tells a leader where to look before answering gate 2 — which is the
-- whole point of telling them an application arrived.
--
-- MATCHED ON WHAT MAKES THEM DIFFERENT, NOT ON ROW ORDER
--
-- The delete targets the row with no {{lead_link}} in it. row_number() over
-- created_at would work today and would silently target the wrong row if these
-- were ever re-seeded in a different order. The lead link is the actual
-- difference and is what the kept copy exists for.
--
-- Idempotent: deletes nothing if only one row remains.
-- ===========================================================================

begin;

-- Retired, not destroyed — same table 366 introduced.
insert into public.admissions_retired_templates
  (template_key, trigger_event, subject, body, retired_reason)
select t.template_key, t.trigger_event, t.subject, t.body,
       'Duplicate of staff_application_submitted, kept the copy carrying '
       || '{{lead_link}} and the parent''s contact details. Deleted 15 Sep 2026.'
from public.admissions_communication_templates t
where t.school_id is null
  and t.template_key = 'staff_application_submitted'
  and t.body not like '%{{lead_link}}%'
  and not exists (
    select 1 from public.admissions_retired_templates r
     where r.template_key = t.template_key
       and r.body = t.body
  );

delete from public.admissions_communication_templates
where school_id is null
  and template_key = 'staff_application_submitted'
  and body not like '%{{lead_link}}%'
  -- Only when the better copy actually survives. If {{lead_link}} is missing
  -- from BOTH, this deletes nothing rather than leaving the staff notice gone.
  and exists (
    select 1 from public.admissions_communication_templates keep
     where keep.school_id is null
       and keep.template_key = 'staff_application_submitted'
       and keep.body like '%{{lead_link}}%'
  );

-- ---------------------------------------------------------------------------
-- JIMMY'S WORDING ON THE KEPT COPY
--
-- The surviving sentence told the leader WHY the family wrote what they wrote.
-- His replacement tells them what to DO with it — which is the difference
-- between a nice line and an instruction:
--
--   was  "Read it before you answer the shadow-days decision waiting for you.
--         What a family says about their child's greatness and challenges is
--         the reason they chose to tell us."
--
--   now  "Read {{student_name}}'s application before you answer the shadow-days
--         decision waiting for you. What a family says about their child's
--         GREATNESS and challenges should be thoughtfully considered in you
--         determining if shadow days should be scheduled."
--
-- Done with replace() on the existing body rather than rewriting it whole, so
-- every other line survives byte-for-byte instead of depending on this
-- migration transcribing them correctly. Verified in section 6 rather than
-- assumed: a replace() that matches nothing changes nothing and reports success.
--
-- GREATNESS is capitalised because he capitalised it.
-- ---------------------------------------------------------------------------
update public.admissions_communication_templates
   set body = replace(
         body,
         'Read it before you answer the shadow-days decision waiting for you. What a family says about their child''s greatness and challenges is the reason they chose to tell us.',
         'Read {{student_name}}''s application before you answer the shadow-days decision waiting for you. What a family says about their child''s GREATNESS and challenges should be thoughtfully considered in you determining if shadow days should be scheduled.'
       ),
       updated_at = now()
 where school_id is null
   and template_key = 'staff_application_submitted'
   and body like '%{{lead_link}}%';

commit;

-- ---------------------------------------------------------------------------
-- The index, now that nothing blocks it.
--
-- NULL = NULL is not true, so the (school_id, template_key) unique index never
-- constrained network-wide rows at all, and every `on conflict (school_id,
-- template_key) do update` in the seed migrations inserted another copy instead
-- of updating. This is the constraint those clauses always assumed they had.
-- ---------------------------------------------------------------------------
create unique index if not exists admissions_templates_one_network_wide_per_key
  on public.admissions_communication_templates (template_key)
  where school_id is null;

comment on index public.admissions_templates_one_network_wide_per_key is
  'One network-wide template per key. Added 15 Sep 2026 after the decline '
  'letter was found seeded twice — NULL = NULL is not true, so the original '
  'unique index permitted unlimited copies whose school_id is null.';

-- ===========================================================================
-- VERIFY
-- ===========================================================================

-- 1. Nothing duplicated network-wide any more. EXPECT NOTHING.
select '1. STILL DUPLICATED' as check, template_key as detail, count(*)::text as extra
from public.admissions_communication_templates
where school_id is null
group by template_key
having count(*) > 1

union all

-- 2. The index exists. This is the line that failed in 368.
select '2. index', indexname, 'present'
from pg_indexes
where schemaname = 'public'
  and indexname = 'admissions_templates_one_network_wide_per_key'

union all

-- 3. The staff notice that survived. EXPECT one row, the one with the lead link.
select '3. staff notice',
       left(subject, 45),
       case when body like '%{{lead_link}}%'
            then 'has lead link — the right copy'
            else 'NO LEAD LINK — the wrong copy survived' end
from public.admissions_communication_templates
where school_id is null
  and template_key = 'staff_application_submitted'

union all

-- 4. Everything retired so far, so nothing was lost silently.
select '4. retired', template_key, left(retired_reason, 45)
from public.admissions_retired_templates

union all

-- 6. JIMMY'S SENTENCE IS ACTUALLY IN THERE. A replace() whose search string
--    does not match changes nothing and reports success, so this is checked
--    rather than assumed. EXPECT "his wording is live".
select '6. wording',
       'staff_application_submitted',
       case
         when body like '%should be thoughtfully considered%'
           then 'his wording is live'
         when body like '%is the reason they chose to tell us%'
           then 'REPLACE DID NOT MATCH — the old sentence is still there'
         else 'neither sentence found — read the body before trusting this'
       end
from public.admissions_communication_templates
where school_id is null
  and template_key = 'staff_application_submitted'

union all

-- 5. The decline letter, once.
select '5. decline letter',
       coalesce(s.name, '(network-wide)'),
       t.template_key
from public.admissions_communication_templates t
left join public.schools s on s.id = t.school_id
where t.template_key = 'application_declined_email'

order by 1, 2;

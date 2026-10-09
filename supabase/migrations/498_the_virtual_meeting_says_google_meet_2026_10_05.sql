-- 498_the_virtual_meeting_says_google_meet_2026_10_05.sql
--
-- One sentence, at The Academy Virtual and The Academy HS.
--
-- Jimmy, 5 October: "make this virtual google meets meeting link instead of
-- video link".
--
--   was   The video link will be in your calendar invitation.
--   now   The Google Meet link will be in your calendar invitation.
--
-- "GOOGLE MEET", NOT "GOOGLE MEETS". The product has no S - it is Google
-- Meet, the way it is Google Drive and not Google Drives. This letter is the
-- second thing a family ever reads from us and the first that names a tool
-- they have to use, so it is worth getting the name right. If Jimmy wants the
-- S, it is this file and nothing else.
--
-- WHY THE CHANGE IS WORTH MAKING AT ALL. "The video link" could mean a link
-- we will email separately, a link on a web page, or a recording. A parent
-- who has never used Google Meet does not know they already have what they
-- need. Naming the product says where to look - the calendar entry they are
-- about to receive - and removes the most common reason a family joins a
-- virtual meeting late or not at all.
--
-- GA AND FL ARE UNTOUCHED. Their letter (migration 493) is about a telephone
-- call and never mentions a video link at all.
--
-- NOTHING ELSE IN THE BODY MOVES. The update is guarded on the exact old
-- sentence, so if 496 has not run, or the wording has already been changed by
-- hand, this matches nothing and says so rather than overwriting somebody's
-- edit.
--
-- Safe to re-run: the guard means a second run matches nothing.

begin;

do $$
declare
  touched integer;
begin
  update public.admissions_communication_templates t
     set body = replace(
                  t.body,
                  'The video link will be in your calendar invitation.',
                  'The Google Meet link will be in your calendar invitation.'
                ),
         updated_at = now()
    from public.schools sc
   where sc.id = t.school_id
     and t.template_key = 'inquiry_thank_you_email'
     and sc.name in ('The Academy Virtual', 'The Academy HS')
     and t.body like '%The video link will be in your calendar invitation.%';

  get diagnostics touched = row_count;

  if touched = 0 then
    raise notice 'Nothing matched. Either 496 has not run, or the sentence has already been changed.';
  elsif touched <> 2 then
    raise exception 'Expected 2 campus rows, changed % - look at the verify below before going further.', touched;
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT five rows.
--
--   The Academy HS        Google Meet     <- both of these must read
--   The Academy Virtual   Google Meet     <- 'Google Meet'
--   The Academy FL        phone call      <- unchanged, says nothing about video
--   The Academy GA        phone call      <- unchanged
--   every campus          the old wording <- the unused network fallback
--
-- If either of the first two still reads 'video link', the update matched
-- nothing and the sentence a parent reads has not changed.

select coalesce(sc.name, 'every campus')                        as campus,

       case
         when t.body like '%Google Meet link%'          then 'Google Meet'
         when t.body like '%video link%'                then '*** STILL SAYS VIDEO LINK ***'
         when t.body like '%phone conversation%'        then 'phone call'
         when t.body like '%We will use this time together%' then 'the old wording'
         else 'other'
       end                                                      as says,

       case when t.is_active then 'ON' else 'off' end           as state,

       /* The one sentence itself, so the words are visible and not inferred
          from a LIKE. substring returns null when the pattern is absent,
          which is itself the answer. */
       coalesce(
         substring(t.body from 'The [A-Za-z ]*link will be in your calendar invitation\.'),
         '—'
       )                                                        as the_sentence

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key = 'inquiry_thank_you_email'

 order by campus;

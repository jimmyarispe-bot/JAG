-- 504_the_two_shadow_day_letters_2026_10_05.sql
--
-- Two revisions Jimmy gave on 5 October, both about shadow days.
--
--   5a  shadow_days_invite_email   one sentence shortened, one deleted
--   5b  shadow_day_booked_email    one sentence deleted
--
-- ── 5a ───────────────────────────────────────────────────────────────────────
--
--   was   We would like to invite {{student_first_name}} to spend 1 or 2
--         Shadow Days with us at our school. Virtual students are required
--         to attend 1 Shadow Day and In-Person/Campus students are required
--         to attend 2 Shadow Days with us. During this time, ...
--
--   now   We would like to invite {{student_first_name}} to spend 2 Shadow
--         Days with us. During this time, ...
--
-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  READ THIS BEFORE RUNNING. shadow_days_invite_email is ONE NETWORK ROW,  ║
-- ║  school_id null, seeded that way in migration 247 and never overridden   ║
-- ║  at any campus. All four campuses read the same words.                   ║
-- ║                                                                          ║
-- ║  The deleted sentence is the only place the letter tells them apart:     ║
-- ║  "Virtual students are required to attend 1 Shadow Day and               ║
-- ║  In-Person/Campus students are required to attend 2 Shadow Days."        ║
-- ║                                                                          ║
-- ║  SO THIS TELLS VIRTUAL FAMILIES TWO DAYS. If Virtual is still one day,   ║
-- ║  the letter needs to become a campus override instead, which is a        ║
-- ║  different migration. Say so and nothing is lost - this has not run.     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- NOT CHANGED, AND WORTH A SECOND LOOK: "we trust will enjoy the day(s) with
-- us". The parenthetical existed because the number was 1 or 2. With it fixed
-- at two, "day(s)" reads like a form letter. One word fixes it, and it is not
-- in what Jimmy sent, so it is left alone - his words are not edited on
-- inference.
--
-- ── 5b ───────────────────────────────────────────────────────────────────────
--
--   deleted   If this day/time no longer works, reply to this message and
--             we'll find another.
--
-- The paragraph now ends at "...specific details concerning the day."
--
-- THE SENTENCE WAS AN INVITATION TO RESCHEDULE, offered at the moment a
-- family had just finished scheduling. The calendar invitation Google sends
-- already carries a reschedule link, which is the thing that actually moves
-- the appointment; this offered a slower second route to the same place and
-- put the idea in front of someone who had not asked for it.
--
-- WHAT IS LEFT IS STILL REACHABLE. The letter is signed by the admissions
-- contact and a reply still reaches a person - the sentence being removed
-- was the offer, not the route.
--
-- Safe to re-run: both updates are guarded on the exact text they replace, so
-- a second run matches nothing and says so.

begin;

-- ── 1. 5a: two Shadow Days, no campus split ──────────────────────────────────

do $$
declare
  touched integer;
begin
  update public.admissions_communication_templates
     set body = replace(
                  body,
                  'to spend 1 or 2 Shadow Days with us at our school. Virtual students are required to attend 1 Shadow Day and In-Person/Campus students are required to attend 2 Shadow Days with us. During this time,',
                  'to spend 2 Shadow Days with us. During this time,'
                ),
         updated_at = now()
   where template_key = 'shadow_days_invite_email'
     and body like '%to spend 1 or 2 Shadow Days with us at our school.%';

  get diagnostics touched = row_count;
  raise notice '5a rows changed: %.', touched;
  if touched = 0 then
    raise notice '5a matched nothing - already changed, or the live wording differs from what was quoted.';
  end if;
end $$;

-- ── 2. 5b: the reschedule offer goes ─────────────────────────────────────────

do $$
declare
  touched integer;
begin
  update public.admissions_communication_templates
     set body = replace(
                  body,
                  $old$ If this day/time no longer works, reply to this message and we'll find another.$old$,
                  ''
                ),
         updated_at = now()
   where template_key = 'shadow_day_booked_email'
     and body like $g$%If this day/time no longer works, reply to this message and we'll find another.%$g$;

  get diagnostics touched = row_count;
  raise notice '5b rows changed: %.', touched;
  if touched = 0 then
    raise notice '5b matched nothing - already changed, or the live wording differs from what was quoted.';
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT two rows, both 'every campus' and both ON.
--
--   5a   two days          and the_sentence showing the shortened wording
--   5b   offer removed
--
-- If either reads '*** STILL ... ***' the guard did not match and the live
-- body differs from what was quoted. Paste the_sentence back and the guard
-- can be corrected - nothing will have been half-changed, because each
-- replace is all-or-nothing on one exact string.
--
-- MORE THAN TWO ROWS means a campus override exists that migration 247 did
-- not create, and this has changed that too. Worth knowing either way.

select case t.template_key
         when 'shadow_days_invite_email' then '5a  the invitation'
         else '5b  booked confirmation'
       end                                                     as step,
       coalesce(sc.name, 'every campus')                       as applies_to,
       case when t.is_active then 'ON' else 'off' end          as state,

       case
         when t.template_key = 'shadow_days_invite_email' then
           case when t.body like '%to spend 2 Shadow Days with us. During%'
                then 'two days'
                else '*** STILL 1 OR 2 ***' end
         else
           case when t.body like '%we''ll find another.%'
                then '*** OFFER STILL THERE ***'
                else 'offer removed' end
       end                                                     as says,

       case when t.template_key = 'shadow_days_invite_email'
            then coalesce(substring(t.body from 'We would like to invite.{0,110}'), '—')
            else coalesce(substring(t.body from 'Please check.{0,110}'), '—')
       end                                                     as the_sentence,

       case when t.body like '%day(s)%'
            then 'still says day(s)' else '—' end              as note

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key in ('shadow_days_invite_email', 'shadow_day_booked_email')

 order by step, applies_to;

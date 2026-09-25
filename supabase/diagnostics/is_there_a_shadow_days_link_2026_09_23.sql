/*
  IS THERE A SHADOW DAYS LINK — read-only. Nothing here writes.

  WHY. The shadow_days_invited letter contains:

      "You can choose your days here: {{shadow_days_link}}"

  which resolves to schools.shadow_days_url through:

      shadow_days_link: ctx.shadowDaysUrl ?? ""            (merge-fields.ts)
      shadowDaysUrl: clean(schoolOf(lead)?.shadow_days_url) (engine.ts)

  The `?? ""` is the problem. A campus with no URL does not produce an error or
  a visible broken token - it produces the sentence "You can choose your days
  here: " with nothing after the colon, and sends it to a family who has just
  finished an application. That is the same shape as everything else found this
  week: the absence renders as silence rather than as a fault.

  This runs BEFORE anyone answers an invite_to_shadow_days gate. That template
  has never fired, for anybody, so nothing has ever tested it.

  WHAT EMPTY MEANS, decided before running it:

  1. the link — a URL is the good answer. 'NOT SET' means that campus must not
                have a shadow-days gate answered YES until someone sets it, or
                the family receives a sentence that stops mid-air.
  2. who is near it — leads at application_submitted are the ones who would
                trigger this next. Zero rows today is expected: no application
                has ever been submitted. Lisa Roy will be the first.
*/

select
  '1. the link' as check,
  s.name as detail,
  coalesce(nullif(btrim(s.shadow_days_url), ''), 'NOT SET - the letter would end "choose your days here: " with nothing')
    as extra
from public.schools s

union all

select
  '2. who is near it',
  coalesce(sc.name, 'no school'),
  count(*)::text || ' lead(s) at application_submitted'
from public.admissions_leads l
left join public.schools sc on sc.id = l.school_id
where l.lead_stage = 'application_submitted'
group by sc.name

order by 1, 2;

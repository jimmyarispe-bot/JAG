-- WHOSE EMAIL IS ON JAYDEN ROY'S RECORD
--
-- 29 September 2026. Jimmy, looking at the finder output: "lisinda1974@... for
-- ga?" - the address does not look like it belongs to this family.
--
-- WHY THIS IS WORTH A QUERY RATHER THAN A GUESS. The 8 September import
-- (308_import_admissions_2026_09_08.sql) recorded Jayden's guardian as LISA
-- ROY. If the address on the record belongs to a different family, then every
-- acceptance, every portal invitation and the $100 demand have been aimed at
-- the wrong household - and the portal link hands whoever holds that address
-- access to another family's application.
--
-- Rashard Salinding was accepted at Virtual on 28 September and the four real
-- guardian addresses seen on 28 September included sssalinding@yahoo.com.
-- "lisinda" and "salinding" are close enough that a mix-up is worth ruling in
-- or out rather than assuming.
--
-- CORRECTED. The first version of this file guessed `recipient_email` and
-- `created_at` on admissions_communications. The column is `sent_to`, the
-- timestamp is `sent_at`, and `delivery_status`, `template_key` and
-- `is_staff_notification` were added by a later migration. Every column here
-- now comes from the create statement in 066 plus the alters that followed.
--
-- That is the third guessed column name in this session. The rule I keep
-- breaking is simple: read the create statement before writing the select.
--
-- Reads only. Nothing is changed.

select x.section, x.item, x.detail
from (
  -- 1. What the record actually says, name and address side by side.
  select 1 as ord, 'A. JAYDEN''S RECORD' as section,
         l.first_name || ' ' || l.last_name as item,
         'guardian_name=' || coalesce(l.guardian_first_name || ' ' || l.guardian_last_name, '(none)')
           || '   guardian_email=' || coalesce(l.guardian_email, '(none)')
           || '   guardian_phone=' || coalesce(l.guardian_phone, '(none)')
           || '   campus=' || coalesce(s.name, '(none)') as detail
    from public.admissions_leads l
    left join public.schools s on s.id = l.school_id
   where l.id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'

  union all

  -- 2. Every lead sharing that address. More than one child is normal for
  --    siblings; more than one FAMILY NAME is the mix-up.
  select 2, 'B. WHO ELSE USES THAT ADDRESS',
         l2.first_name || ' ' || l2.last_name,
         'campus=' || coalesce(s2.name, '(none)')
           || '   guardian=' || coalesce(l2.guardian_first_name || ' ' || l2.guardian_last_name, '(none)')
           || '   stage=' || coalesce(l2.lead_stage, '(none)')
    from public.admissions_leads l2
    left join public.schools s2 on s2.id = l2.school_id
   where lower(l2.guardian_email) = (
           select lower(guardian_email) from public.admissions_leads
            where id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2')

  union all

  -- 3. Any lead whose surname is Roy, in case the real record is elsewhere.
  select 3, 'C. EVERY ROY IN THE JAG',
         l3.first_name || ' ' || l3.last_name,
         'campus=' || coalesce(s3.name, '(none)')
           || '   guardian=' || coalesce(l3.guardian_first_name || ' ' || l3.guardian_last_name, '(none)')
           || '   email=' || coalesce(l3.guardian_email, '(none)')
    from public.admissions_leads l3
    left join public.schools s3 on s3.id = l3.school_id
   where lower(l3.last_name) like '%roy%'
      or lower(coalesce(l3.guardian_last_name,'')) like '%roy%'

  union all

  -- 4. Anyone whose address looks like Salinding, to rule the swap in or out.
  select 4, 'D. THE SALINDING FAMILY',
         l4.first_name || ' ' || l4.last_name,
         'campus=' || coalesce(s4.name, '(none)')
           || '   guardian=' || coalesce(l4.guardian_first_name || ' ' || l4.guardian_last_name, '(none)')
           || '   email=' || coalesce(l4.guardian_email, '(none)')
    from public.admissions_leads l4
    left join public.schools s4 on s4.id = l4.school_id
   where lower(coalesce(l4.guardian_email,'')) like '%salinding%'
      or lower(coalesce(l4.guardian_email,'')) like '%lisinda%'
      or lower(l4.last_name) like '%salinding%'

  union all

  -- 5. What has actually been sent to that address, and whether it arrived.
  select 5, 'E. WHAT WENT TO THAT ADDRESS',
         coalesce(c.template_key, c.communication_type, '(unnamed)'),
         'to=' || coalesce(c.sent_to, '(none)')
           || '   status=' || coalesce(c.delivery_status, '(none)')
           || '   staff_notice=' || coalesce(c.is_staff_notification::text, '?')
           || '   at=' || coalesce(c.sent_at::date::text, '(none)')
    from public.admissions_communications c
   where c.lead_id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'
) x
order by x.section, x.item, x.detail;

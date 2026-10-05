-- ============================================================================
-- IS THE TOUR STEP READY TO ARM?
-- 5 October 2026 — read-only. ONE statement, ONE grid.
--
-- src/lib/admissions/tour.ts names four things that must be true before
-- ADMISSIONS_TOUR_GATE is set to on. Three of them are in the database and
-- this answers all three. The fourth — one family walked through the whole
-- path on purpose — is yours, not the database's.
--
--   1. staff_inquiry_call_held   ACTIVE at GA and FL   (the RECORD-your-notes letter)
--   2. tour_invitation_sent      ACTIVE at GA and FL   (T1, written off by 508)
--   3. both campuses have a tour booking link
--
-- Every 'ready' in the verdict column means the gate can be armed.
-- ============================================================================

select  1                                            as ord,
        'the notes letter'                           as requirement,
        sc.name                                      as campus,
        t.template_key,
        case when t.is_active then 'ON' else 'off' end as state,
        case when t.is_active then 'ready'
             else '>>> OFF — arm the gate and the leader gets no notes letter'
        end                                          as verdict
   from public.admissions_communication_templates t
   join public.schools sc on sc.id = t.school_id
  where t.trigger_event = 'staff_inquiry_call_held'
    and sc.name in ('The Academy GA', 'The Academy FL')

union all

select  2,
        'T1 the tour invitation',
        sc.name,
        t.template_key,
        case when t.is_active then 'ON' else 'off' end,
        case when t.is_active then 'ready'
             else '>>> OFF — arm the gate and the family is invited to nothing'
        end
   from public.admissions_communication_templates t
   join public.schools sc on sc.id = t.school_id
  where t.trigger_event = 'tour_invitation_sent'
    and sc.name in ('The Academy GA', 'The Academy FL')

union all

select  3,
        'the tour booking link',
        sc.name,
        coalesce(nullif(trim(sc.tour_booking_url), ''), '(NOT SET)'),
        case when coalesce(trim(sc.tour_booking_url), '') <> '' then 'set' else 'MISSING' end,
        case when coalesce(trim(sc.tour_booking_url), '') <> '' then 'ready'
             else '>>> NO LINK — T1 would email an empty space'
        end
   from public.schools sc
  where sc.name in ('The Academy GA', 'The Academy FL')

order by ord, campus;

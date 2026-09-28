-- Which schools have no signature documents, and since when?
--
-- Migration 447 refused with "3 school(s) now have no signature documents".
-- 447 only touches The Academy GA, so it cannot have caused this. Migration
-- 417 ran the identical check on 25 September and passed, so these three
-- became bare after that date - almost certainly schools created since, which
-- never had 066's templates seeded for them.
--
-- signEnrollmentDocument refuses to complete a packet for a school with no
-- active signature documents. A school in this list cannot enrol anybody.
--
-- READ ONLY.

select sc.name                                                  as school,
       sc.id                                                    as school_id,
       count(t.id)                                              as templates_total,
       count(t.id) filter (where t.is_active)                    as active,
       count(t.id) filter (where t.is_active
                             and t.requires_signature)           as active_signature_docs,
       case
         when count(t.id) = 0
           then 'NO TEMPLATES AT ALL - never seeded'
         when count(t.id) filter (where t.is_active and t.requires_signature) = 0
           then 'HAS TEMPLATES BUT NONE ACTIVE AND SIGNABLE - deactivated'
         else 'ok'
       end                                                       as verdict,
       min(t.created_at)                                         as templates_first_created,
       max(t.updated_at)                                         as templates_last_touched
  from public.schools sc
  left join public.enrollment_packet_templates t on t.school_id = sc.id
 group by sc.name, sc.id
 order by (count(t.id) filter (where t.is_active and t.requires_signature)) asc,
          sc.name;

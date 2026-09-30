-- Exactly what a family would be asked to sign right now, on every campus.
--
-- 417 deleted the worst of the six - the one that bound a family to "the
-- AcademyOS enrollment agreement", which does not exist. The other five were
-- deliberately left alone, and 417 says so: "Deleting the worst of the six is
-- not the same as fixing the set, and the set is still armed."
--
-- This prints the set. READ ONLY.

select sc.name                                as school,
       t.sort_order,
       t.template_key,
       t.title,
       t.requires_signature,
       length(t.body_html)                    as body_length,
       -- the whole document, tags stripped, so it reads as a family reads it
       regexp_replace(t.body_html, '<[^>]+>', '', 'g')  as what_it_actually_says,
       case when t.body_html ilike '%$%'
              or t.body_html ~ '[0-9]{3}'          then 'mentions a figure'
            else 'NO FIGURE, NO DATE, NO TERMS' end as does_it_say_anything
  from public.enrollment_packet_templates t
  join public.schools sc on sc.id = t.school_id
 where t.is_active
 order by sc.name, t.sort_order;

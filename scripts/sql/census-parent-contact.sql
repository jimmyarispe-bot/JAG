-- Where parent contact actually lives, before anything is written.
--
-- READ ONLY. No insert, no update, no delete. Safe to run on The JAG.
--
-- `students` has no contact columns; a student reaches a parent through
--   students.family_id -> families -> guardians
-- Anything the roster import or a hand-created student left unlinked has no
-- parent at all, while the same child's admissions_leads row usually still
-- holds the enquiry contact. This counts each case so the backfill can be
-- written against the real numbers rather than an assumption.
--
-- Match rule for the lead fallback: same school, same first and last name,
-- same date of birth. Name alone is not enough -- this network has several
-- children who share one -- so a student with no date of birth counts as
-- unmatched rather than being guessed at.

with student_contact as (
  select
    st.id,
    st.enrollment_status,
    st.family_id,
    st.admissions_lead_id,
    nullif(trim(f.billing_email), '') as billing_email,
    nullif(trim(f.billing_phone), '') as billing_phone,
    (
      select count(*)
      from public.guardians g
      where g.family_id = st.family_id
        and (nullif(trim(g.email), '') is not null
             or nullif(trim(g.phone), '') is not null)
    ) as reachable_guardians,
    (
      select count(*)
      from public.admissions_leads l
      where l.school_id = st.school_id
        and st.date_of_birth is not null
        and l.date_of_birth = st.date_of_birth
        and lower(trim(l.first_name)) = lower(trim(st.first_name))
        and lower(trim(l.last_name))  = lower(trim(st.last_name))
        and (nullif(trim(l.guardian_email), '') is not null
             or nullif(trim(l.guardian_phone), '') is not null)
    ) as matching_leads
  from public.students st
  left join public.families f on f.id = st.family_id
),
classified as (
  select
    case
      when reachable_guardians > 0                  then '1. guardian record with email or phone'
      when billing_email is not null
        or billing_phone is not null                then '2. family billing contact only, no guardian row'
      when matching_leads = 1                       then '3. nothing on file, exactly one matching lead  <-- backfill these'
      when matching_leads > 1                       then '4. nothing on file, several leads match, ambiguous'
      when family_id is null                        then '5. nothing on file, no family record at all'
      else                                               '6. nothing on file, family exists but is empty'
    end as bucket,
    enrollment_status
  from student_contact
)
select
  bucket,
  count(*)                                                   as students,
  count(*) filter (where enrollment_status = 'enrolled')     as enrolled,
  count(*) filter (where enrollment_status <> 'enrolled')    as not_enrolled
from classified
group by bucket
order by bucket;

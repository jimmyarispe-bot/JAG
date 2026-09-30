-- Has any real family ever answered the Application Wizard?
--
-- Jimmy, 29 September 2026: "delete all of 2. i didn't know anything about
-- this." Before anything is deleted we find out whether a family's answers are
-- sitting in the seven columns the wizard writes. Deleting a screen is cheap.
-- Deleting the only screen that shows a mother's note about her child's
-- medication is not, and nothing else in the JAG renders these columns.
--
-- The wizard writes: guardian_notes, student_summary, previous_school,
-- medical_notes, learning_needs_summary, emergency_contact_name,
-- emergency_contact_phone (migration 321 + earlier).
--
-- One statement. The Supabase editor shows only the last result.

select
  count(*)                                                       as applications_total,
  count(*) filter (where coalesce(guardian_notes, '') <> '')     as guardian_notes,
  count(*) filter (where coalesce(student_summary, '') <> '')    as student_summary,
  count(*) filter (where coalesce(previous_school, '') <> '')    as previous_school,
  count(*) filter (where coalesce(medical_notes, '') <> '')      as medical_notes,
  count(*) filter (where coalesce(learning_needs_summary, '') <> '') as learning_needs,
  count(*) filter (where coalesce(emergency_contact_name, '') <> '') as emerg_name,
  count(*) filter (where coalesce(emergency_contact_phone, '') <> '') as emerg_phone,
  count(*) filter (
    where coalesce(guardian_notes, '') <> ''
       or coalesce(student_summary, '') <> ''
       or coalesce(previous_school, '') <> ''
       or coalesce(medical_notes, '') <> ''
       or coalesce(learning_needs_summary, '') <> ''
       or coalesce(emergency_contact_name, '') <> ''
       or coalesce(emergency_contact_phone, '') <> ''
  )                                                              as any_wizard_answer
from admissions_applications;

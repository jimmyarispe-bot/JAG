-- 321 — give the application wizard steps somewhere to put their answers.
--
-- THE PROBLEM. APPLICATION_WIZARD_STEPS presents eleven steps. Five of them
-- submitted the SAME field name, learning_needs_summary:
--
--   1 Guardian information   -> learning_needs_summary
--   2 Student information    -> learning_needs_summary
--   4 Medical information    -> learning_needs_summary
--   5 Learning profile       -> learning_needs_summary
--
-- A family who completed Guardian, then Student, then Medical kept only the
-- medical text. Each save overwrote the last and reported success.
--
-- The wizard component's own Defaults type already declares `medical_notes`
-- and `guardian_notes`. Whoever wrote it expected these columns; they were
-- never created, so the inputs were aimed at learning_needs_summary instead.
-- This migration creates what the component always assumed.
--
-- learning_needs_summary keeps step 5, the learning profile, which is what its
-- name describes. Nothing is migrated between columns: the existing values are
-- whatever the last-saved step happened to write, so their meaning is unknown
-- and guessing would be worse than leaving them where they are.
--
-- NOTE: hand-run migration. These columns will be absent from the generated
-- database.ts until types are regenerated, so the writer casts narrowly and
-- documents why.

alter table public.admissions_applications
  add column if not exists guardian_notes text,
  add column if not exists student_summary text,
  add column if not exists medical_notes text;

comment on column public.admissions_applications.guardian_notes is
  'Wizard step 1 — notes for admissions from the guardian. Added by 321; previously collided with learning_needs_summary.';

comment on column public.admissions_applications.student_summary is
  'Wizard step 2 — the family''s summary of their student. Added by 321; previously collided with learning_needs_summary.';

comment on column public.admissions_applications.medical_notes is
  'Wizard step 4 — allergies, medications, accommodations. Added by 321; previously collided with learning_needs_summary. NOT a substitute for the allergy action plan on the Emergency and Medical Information Form.';

comment on column public.admissions_applications.learning_needs_summary is
  'Wizard step 5 — learning profile. Until 321 this column also received steps 1, 2 and 4, each overwriting the last.';

-- What the wizard can now distinguish, per application.
select
  count(*) as applications,
  count(guardian_notes) as with_guardian_notes,
  count(student_summary) as with_student_summary,
  count(medical_notes) as with_medical_notes,
  count(learning_needs_summary) as with_learning_profile
from public.admissions_applications;

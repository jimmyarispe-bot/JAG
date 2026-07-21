-- Sprint P009 — indexes for consolidated revenue / enrollment / FI alert hot paths.
-- Additive only; no RLS or business-logic changes.

-- Supports getSectionsRevenue / getStudentsRevenue student invoice fan-in.
create index if not exists idx_invoices_student_id_due_date
  on public.invoices (student_id, due_date)
  where student_id is not null;

-- Supports enrolled-roster lookups by section (teacher + FI section revenue).
create index if not exists idx_student_enrollments_section_status
  on public.student_enrollments (course_section_id, enrollment_status);

-- Supports unresolved FI alert sync / executive alert feeds.
create index if not exists idx_fi_financial_alerts_unresolved
  on public.fi_financial_alerts (school_id, created_at desc)
  where is_resolved = false;

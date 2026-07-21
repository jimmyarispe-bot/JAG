-- =========================================
-- RC1: Student Archive / Restore support columns
-- Soft-archive via status='archived'; previous_status enables restore.
-- =========================================

alter table public.students
  add column if not exists previous_status text;

alter table public.students
  add column if not exists archived_at timestamptz;

alter table public.students
  add column if not exists archived_by uuid references public.users(id) on delete set null;

create index if not exists idx_students_status_archived
  on public.students(status)
  where status = 'archived';

comment on column public.students.previous_status is
  'Status prior to archive; restored when student is un-archived.';
comment on column public.students.archived_at is
  'Timestamp when student was archived.';
comment on column public.students.archived_by is
  'User who archived the student.';

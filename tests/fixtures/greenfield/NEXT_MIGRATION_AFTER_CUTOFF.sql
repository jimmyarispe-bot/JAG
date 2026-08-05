-- Synthetic post-cutoff fixture for Phase 34 forward-compatibility tests.
-- Not a permanent production migration.

create table if not exists public.ga_forward_compat_probe (
  id int primary key default 1 check (id = 1),
  note text not null default 'NEXT_MIGRATION_AFTER_CUTOFF'
);

comment on table public.ga_forward_compat_probe is
  'Temporary forward-compat probe; safe to drop after certification.';

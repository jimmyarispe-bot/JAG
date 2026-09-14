-- 327_school_admissions_contacts_2026_09_11.sql
--
-- Many people hear about an inquiry. One person's calendar gets booked.
--
-- WHY. `schools.admissions_contact_name` / `_email` / `_booking_url` (migration
-- 233) make those the same person by construction. They are not the same job:
--
--   * Being told an inquiry arrived is a notification. A campus leader, an
--     admissions assistant and an executive director can all want it, and
--     nothing breaks when three people know.
--   * Being the name on a booking link is a commitment. It is one person's
--     calendar, and two booking links on one campus is a family double-booked
--     or a family who picks the wrong one.
--
-- So: a row per person, `receives_notifications` on as many as you like, and a
-- partial unique index that permits exactly one booking contact per school.
-- The database refuses the second one rather than trusting a form to.
--
-- `phone` is here because it is where a staff mobile number belongs when SMS is
-- wired. There is no SMS provider today — `twilioAdapter` is a stub whose
-- `isConfigured()` returns false, and the communications engine honestly records
-- `delivery_status = 'logged'` with "SMS provider not configured for v1.0"
-- rather than claiming delivery. The column is inert until that changes.
--
-- WHAT THIS MIGRATION DELIBERATELY DOES NOT DO. It does not change any code
-- path. `engine.ts` still reads the three columns on `schools`, so behaviour is
-- identical the moment this runs — the table is populated and unread. Switching
-- the engine over is a separate, reviewable change to a live communications
-- path, and the admin screen at /dashboard/admin/admissions-contacts still
-- edits the old columns until it is updated too.
--
-- The old columns are NOT dropped. They are the backfill source and the
-- fallback while the switchover happens.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) The table
-- ---------------------------------------------------------------------------

create table if not exists public.school_admissions_contacts (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null
    references public.schools(id) on delete cascade,

  -- Optional, because not every recipient is a JAG user. When it is set, the
  -- in-app row in `admissions_staff_notifications` can be addressed to this
  -- person rather than only to the school.
  user_id uuid references public.users(id) on delete set null,

  name  text not null,
  email text not null,
  phone text,

  receives_notifications boolean not null default true,

  -- The one whose calendar parents book. `booking_url` is a published Google
  -- appointment schedule; it is a string, not an integration.
  is_booking_contact boolean not null default false,
  booking_url text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint school_admissions_contacts_email_per_school
    unique (school_id, email)
);

-- Exactly one active booking contact per school. A partial unique index is the
-- guard because the rule is only about the rows that claim the role.
create unique index if not exists school_admissions_contacts_one_booking
  on public.school_admissions_contacts (school_id)
  where is_booking_contact and is_active;

create index if not exists idx_school_admissions_contacts_school
  on public.school_admissions_contacts (school_id)
  where is_active;

comment on table public.school_admissions_contacts is
  'Admissions notification recipients per school. Many may receive notifications; at most one active row per school may be the booking contact, enforced by a partial unique index.';

comment on column public.school_admissions_contacts.phone is
  'Staff mobile for SMS notification. Inert until an SMS provider is configured — the Twilio adapter is currently a stub.';

drop trigger if exists school_admissions_contacts_set_updated_at
  on public.school_admissions_contacts;
create trigger school_admissions_contacts_set_updated_at
  before update on public.school_admissions_contacts
  for each row execute function public.trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) Backfill from the single-contact columns
-- ---------------------------------------------------------------------------
-- Whoever is the contact today becomes the first recipient AND the booking
-- contact, which is exactly what they are now. Nothing is lost and nobody
-- silently stops being notified.

insert into public.school_admissions_contacts
  (school_id, name, email, receives_notifications, is_booking_contact, booking_url)
select
  s.id,
  coalesce(nullif(trim(s.admissions_contact_name), ''), 'Admissions'),
  lower(trim(s.admissions_contact_email)),
  true,
  true,
  nullif(trim(s.admissions_booking_url), '')
from public.schools s
where nullif(trim(s.admissions_contact_email), '') is not null
on conflict (school_id, email) do nothing;

-- ---------------------------------------------------------------------------
-- 3) Access
-- ---------------------------------------------------------------------------

alter table public.school_admissions_contacts enable row level security;

drop policy if exists school_admissions_contacts_staff_all
  on public.school_admissions_contacts;

create policy school_admissions_contacts_staff_all
on public.school_admissions_contacts
for all
using (can_access_school(school_id))
with check (can_access_school(school_id));

-- ---------------------------------------------------------------------------
-- 4) What exists now, per school
-- ---------------------------------------------------------------------------
-- booking_contacts should be 0 or 1 on every row. It cannot be more — the index
-- would have refused the insert — so a 0 means that campus has nobody whose
-- calendar a parent can book.

select
  s.name as school,
  count(c.id) filter (where c.is_active) as contacts,
  count(c.id) filter (where c.is_active and c.receives_notifications) as notified,
  count(c.id) filter (where c.is_active and c.is_booking_contact) as booking_contacts,
  max(c.email) filter (where c.is_active and c.is_booking_contact) as books_with
from public.schools s
left join public.school_admissions_contacts c on c.school_id = s.id
group by s.id, s.name
order by s.name;

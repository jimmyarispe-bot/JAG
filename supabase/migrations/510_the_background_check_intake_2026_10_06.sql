-- ============================================================================
-- 510 — THE BACKGROUND CHECK INTAKE
-- 6 October 2026
--
-- Jimmy, 6 October: "recreate this to be part of the jag employee function.
-- this would be part of the hiring process. it's for their background check.
-- i need the results of this form to be sent to me in an email. not the form
-- itself just the answers in the email. also need a url to send to staff to
-- complete this form."
--
-- The form it recreates is the Florida Care Provider Background Screening
-- Clearinghouse person profile at crw.flclearinghouse.com/Person/Create. Same
-- fields, same required-ness, WEIGHT DELETED at his instruction.
--
-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  THERE IS NO FULL SSN COLUMN IN THIS TABLE, AND THAT IS DELIBERATE.      ║
-- ║                                                                          ║
-- ║  The Clearinghouse needs a full SSN. Jimmy needs it in front of him to    ║
-- ║  type into crw.flclearinghouse.com. Neither of those requires THE         ║
-- ║  PLATFORM to keep it, and anything this table holds, it holds forever.    ║
-- ║                                                                          ║
-- ║  So the full SSN travels in the notification email and nowhere else.      ║
-- ║  ssn_last4 is what persists - the same four digits the Clearinghouse      ║
-- ║  itself shows as XXX-XX-2907. A breach of this table exposes no SSN.      ║
-- ║                                                                          ║
-- ║  DO NOT ADD ONE LATER without deciding, out loud, that The Academy Way    ║
-- ║  wants to be the custodian of its staff's social security numbers.        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- THE FIRST EMPLOYEE TABLE. There is no employee module yet - Jimmy said so
-- when he asked. This is shaped to be adopted by one rather than to anticipate
-- it: a flat record of one submission, with no foreign key to a staff row that
-- does not exist. When the employee module arrives it can add employee_id.
-- ============================================================================


create table if not exists public.employee_background_checks (
  id uuid primary key default gen_random_uuid(),

  -- Name, exactly as the Clearinghouse asks for it
  first_name       text not null,
  middle_name      text,
  last_name        text not null,
  suffix           text,
  aliases          text,

  -- Identity. FOUR DIGITS ONLY - see the box above.
  ssn_last4        text not null check (ssn_last4 ~ '^[0-9]{4}$'),
  date_of_birth    date not null,
  place_of_birth   text not null,

  -- Where they live
  mailing_address  text not null,
  apt_unit_suite   text,
  city             text not null,
  state            text not null,
  zip_code         text not null,

  -- How to reach them
  phone_number     text not null,
  email_address    text not null,

  -- Physical description. No weight column: Jimmy deleted that field.
  sex              text not null,
  race             text not null,
  hair_color       text not null,
  eye_color        text not null,
  height           text not null,

  -- Did the notification actually leave the building
  submitted_at     timestamptz not null default now(),
  notified_at      timestamptz,
  notify_error     text,

  created_at       timestamptz not null default now()
);

comment on table public.employee_background_checks is
  'One staff background-screening submission from /background-check. Holds ssn_last4 only - the full SSN travels in the notification email and is never stored. Recreates the Florida Clearinghouse person profile, minus weight.';

comment on column public.employee_background_checks.ssn_last4 is
  'Last four digits only, as the Clearinghouse itself displays (XXX-XX-2907). The full SSN is never persisted anywhere in this platform.';


-- ── Who can read it: nobody, through the API ────────────────────────────────
--
-- RLS ON AND NOT ONE POLICY, ON PURPOSE.
--
-- With RLS enabled and no policy, no authenticated session can select, insert
-- or update a row - PostgREST returns nothing to everyone. Only the service
-- role reaches it, which is the server action that writes the submission and
-- nothing else.
--
-- WHY THAT IS THE RIGHT STARTING POINT. Nothing in the platform displays this
-- data. The deliverable Jimmy asked for is an email. A read policy would be
-- granting access that no screen needs, to the most sensitive table in the
-- build, on the chance it is wanted later. When an employee module needs to
-- show a screening, that is the moment to decide who sees it - deliberately,
-- in its own migration, with Jimmy's word on it.
--
-- Nina, Danni and Heather are all SCHOOL_LEADER. A read policy written on that
-- role would put every campus leader in front of every other campus's staff
-- dates of birth. That is exactly the decision that should not be made by
-- copying a policy from another table.

alter table public.employee_background_checks enable row level security;

drop policy if exists employee_background_checks_read on public.employee_background_checks;
drop policy if exists employee_background_checks_write on public.employee_background_checks;


-- ── One index, for the only question anyone will ask ────────────────────────
-- "Did this person already submit one?"

create index if not exists employee_background_checks_name_dob_idx
  on public.employee_background_checks (lower(last_name), lower(first_name), date_of_birth);

create index if not exists employee_background_checks_submitted_idx
  on public.employee_background_checks (submitted_at desc);


-- ── Verify ──────────────────────────────────────────────────────────────────
--
-- WHAT GOOD LOOKS LIKE:
--   section 1  no row named ssn, ssn_full or social_security_number
--   section 2  rls_enabled true, policy_count 0
--   section 3  21 columns, and 'weight' is not among them

select 'no full ssn column'                       as check_name,
       count(*)                                   as should_be_zero,
       case when count(*) = 0 then 'ok'
            else '*** A FULL SSN COLUMN EXISTS - READ MIGRATION 510 ***'
       end                                        as verdict
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'employee_background_checks'
   and column_name in ('ssn', 'ssn_full', 'social_security_number', 'ssn_encrypted');

select 'locked down'                              as check_name,
       c.relrowsecurity                            as rls_enabled,
       (select count(*) from pg_policies p
         where p.schemaname = 'public'
           and p.tablename = 'employee_background_checks') as policy_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname = 'employee_background_checks';

select 'the fields'                               as check_name,
       count(*)                                   as column_count,
       case when bool_or(column_name = 'weight')
            then '*** WEIGHT IS STILL HERE ***' else 'no weight column' end as verdict
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'employee_background_checks';

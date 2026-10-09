-- ============================================================================
-- 511 — THE SIGNED PRIVACY ACKNOWLEDGEMENT
-- 6 October 2026
--
-- Jimmy, 6 October: "in/on the form include the attached and they cannot
-- submit the form without uploading this signed and dated" ... "obviously
-- store this and link them to the specific employee records" ... "in the jag".
--
-- The attachment is the Clearinghouse PRIVACY POLICY ACKNOWLEDGEMENT FORM:
-- page 1 carries three lines the hire fills in - printed name, signature,
-- date - followed by the FDLE applicant notice and the FBI Privacy Act
-- Statement. Without it the screening cannot proceed, which is why the form
-- refuses to submit until it is uploaded.
--
-- STORED IN THE JAG, ON THE RECORD IT BELONGS TO. Not emailed as an
-- attachment, not parked in a drive. The file goes to a private Supabase
-- Storage bucket at a path keyed by the row id, and the row carries the path.
-- There is one employee record today and it is the background-check row; when
-- the employee module arrives it inherits both the row and its document.
--
-- THE BLANK FORM IS A STATIC ASSET, NOT A STORED FILE. It is the same document
-- for every hire, so it lives at public/privacy-policy-acknowledgement.pdf and
-- is served from /privacy-policy-acknowledgement.pdf. Only the SIGNED copy is
-- per-person and only the signed copy is stored.
-- ============================================================================


-- ── 1. A private bucket for employee documents ──────────────────────────────
--
-- Same shape as admissions-documents from migration 065: private, 10 MB,
-- and a mime allowlist. A signed form arrives as a PDF from a scanner or a
-- photograph from a phone, so both are permitted - a new hire holding a
-- signed sheet and a phone camera should not be blocked on file format.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-documents',
  'employee-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic'
  ]::text[]
)
on conflict (id) do update set
  public             = false,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- NO POLICIES ON storage.objects FOR THIS BUCKET, deliberately, and for the
-- same reason migration 510 left the table without one: the bucket is private,
-- so only the service role reaches it, and the only thing reaching it is the
-- server action that writes the upload. A signed acknowledgement carries a
-- person's name, signature and the fact of their screening. When a screen
-- needs to show one, that is a decision with its own migration behind it.


-- ── 2. The row carries the document ─────────────────────────────────────────

alter table public.employee_background_checks
  add column if not exists privacy_ack_path         text,
  add column if not exists privacy_ack_filename     text,
  add column if not exists privacy_ack_bytes        integer,
  add column if not exists privacy_ack_content_type text,
  add column if not exists privacy_ack_uploaded_at  timestamptz;

comment on column public.employee_background_checks.privacy_ack_path is
  'Path inside the private employee-documents bucket, keyed by this row id. The signed Clearinghouse Privacy Policy Acknowledgement. Required by the form; nullable here because migration 510 shipped before this one and the first test row has none.';

/*
 * NULLABLE IN THE DATABASE, REQUIRED BY THE FORM, AND THAT IS NOT SLOPPINESS.
 *
 * The form will not submit without the upload, so every row written from here
 * on carries one. A NOT NULL constraint would also be a claim about rows that
 * already exist - migration 510 shipped first and Jimmy's test submission has
 * no document - and a migration that fails on live data at 11am is worse than
 * a column that admits the truth.
 *
 * Section 4 below lists any row without one, so the gap is visible rather
 * than assumed away.
 */


-- ── 3. Verify the bucket ────────────────────────────────────────────────────
--
-- WHAT GOOD LOOKS LIKE: one row, is_private true, 10485760, and a mime list
-- containing application/pdf.

select 'the bucket'                                   as check_name,
       b.id,
       (not b.public)                                 as is_private,
       b.file_size_limit,
       array_to_string(b.allowed_mime_types, ', ')    as accepts,
       (select count(*) from pg_policies p
         where p.schemaname = 'storage'
           and p.tablename = 'objects'
           and p.qual like '%employee-documents%')     as policies_naming_this_bucket,
       case when b.public then '*** BUCKET IS PUBLIC - ANYONE WITH A URL CAN READ A SIGNATURE ***'
            else 'ok - private, service role only'
       end                                            as verdict
  from storage.buckets b
 where b.id = 'employee-documents';


-- ── 4. Which rows have no signed acknowledgement ────────────────────────────
--
-- WHAT GOOD LOOKS LIKE: only Jimmy's own test submissions from before this
-- migration. Any real hire listed here has not signed, and their screening
-- cannot proceed.

select 'rows without a signed form'                   as check_name,
       c.first_name || ' ' || c.last_name             as who,
       to_char(c.submitted_at at time zone 'America/New_York',
               'Mon DD  HH12:MI AM')                  as submitted_eastern,
       coalesce(c.privacy_ack_filename, '(none)')     as document
  from public.employee_background_checks c
 where c.privacy_ack_path is null
 order by c.submitted_at desc;

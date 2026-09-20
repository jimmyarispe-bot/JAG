-- 245_person_documents.sql
--
-- Documents attached to a person — student, admissions prospect, or employee.
--
-- JAG already stores documents, but only against an admissions APPLICATION
-- (application_documents, bucket 'admissions-documents'). There is nowhere to
-- put a transcript for an enrolled student, an IEP, a teaching certificate, an
-- I-9, or a signed contract for a member of staff. This is that place.
--
-- Deliberately polymorphic. The three subjects live in three different tables
-- (students, admissions_leads, employees) and a document does not care which —
-- forcing three near-identical tables would triple the RLS surface and the UI.
-- The cost is no foreign key; the guard is a trigger below that refuses a
-- subject_id which does not exist in the table its subject_type names, so a
-- document can never be attached to nobody.
--
-- Two kinds of attachment:
--   'upload'      a file in the private person-documents bucket
--   'google_doc'  a link to a Doc, Sheet, Slide or Drive file
--   'link'        any other URL
-- One row shape covers all three, and the CHECK below makes the wrong
-- combination impossible rather than merely discouraged.

create table if not exists public.person_documents (
  id                uuid primary key default gen_random_uuid(),

  -- Who the document is about.
  subject_type      text not null check (subject_type in ('student', 'lead', 'employee')),
  subject_id        uuid not null,

  title             text not null,
  -- Free-form but suggested in the UI, so filtering stays possible without
  -- pinning the school network to a taxonomy nobody agreed to.
  category          text,
  notes             text,

  source            text not null default 'upload'
                    check (source in ('upload', 'google_doc', 'link')),

  -- Set for source='upload'. Path inside the private bucket.
  storage_path      text,
  -- Set for source='google_doc' or 'link'.
  external_url      text,

  file_name         text,
  mime_type         text,
  file_size_bytes   bigint check (file_size_bytes is null or file_size_bytes >= 0),

  uploaded_by       uuid references public.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- An upload with no file, or a link with no URL, is a row that renders as a
  -- broken attachment. Refuse it at write time instead.
  constraint person_documents_payload_present check (
    (source = 'upload' and storage_path is not null and external_url is null)
    or (source in ('google_doc', 'link') and external_url is not null and storage_path is null)
  ),
  constraint person_documents_url_shape check (
    external_url is null or external_url ~* '^https://'
  )
);

create index if not exists person_documents_subject_idx
  on public.person_documents (subject_type, subject_id, created_at desc);
create index if not exists person_documents_category_idx
  on public.person_documents (category)
  where category is not null;

-- Keep updated_at honest.
create or replace function public.touch_person_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists person_documents_touch_updated_at on public.person_documents;
create trigger person_documents_touch_updated_at
  before update on public.person_documents
  for each row execute function public.touch_person_documents_updated_at();

-- The missing foreign key, enforced by hand.
--
-- Without this, a typo in subject_id produces a document attached to a person
-- who does not exist: invisible in the UI, invisible in every report, and
-- impossible to find again. Silent orphaning is the failure this codebase
-- specialises in, so it is worth the trigger.
create or replace function public.person_documents_subject_exists()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  found boolean;
begin
  if new.subject_type = 'student' then
    select exists(select 1 from public.students where id = new.subject_id) into found;
  elsif new.subject_type = 'lead' then
    select exists(select 1 from public.admissions_leads where id = new.subject_id) into found;
  elsif new.subject_type = 'employee' then
    select exists(select 1 from public.employees where id = new.subject_id) into found;
  else
    raise exception 'Unknown subject_type %', new.subject_type;
  end if;

  if not found then
    raise exception 'No % exists with id % — refusing to attach a document to nobody',
      new.subject_type, new.subject_id;
  end if;

  return new;
end;
$$;

drop trigger if exists person_documents_check_subject on public.person_documents;
create trigger person_documents_check_subject
  before insert or update of subject_type, subject_id on public.person_documents
  for each row execute function public.person_documents_subject_exists();

-- ------------------------------------------------------------------ RLS ----
--
-- Student and prospect paperwork answers to students.view / students.edit.
-- Staff paperwork answers to hr.view / hr.manage. An HR file is not something
-- every teacher should be able to open, and a transcript is not an HR record.

alter table public.person_documents enable row level security;

drop policy if exists person_documents_select on public.person_documents;
create policy person_documents_select on public.person_documents
  for select
  using (
    case
      when subject_type in ('student', 'lead') then public.has_permission('students.view')
      when subject_type = 'employee'           then public.has_permission('hr.view')
      else false
    end
  );

drop policy if exists person_documents_insert on public.person_documents;
create policy person_documents_insert on public.person_documents
  for insert
  with check (
    case
      when subject_type in ('student', 'lead') then public.has_permission('students.edit')
      when subject_type = 'employee'           then public.has_permission('hr.manage')
      else false
    end
  );

-- UPDATE needs both USING and WITH CHECK. A table with RLS on and only one of
-- them matches zero rows and reports success — exactly what `schools` did until
-- migration 235, where every edit had silently written nothing for months.
drop policy if exists person_documents_update on public.person_documents;
create policy person_documents_update on public.person_documents
  for update
  using (
    case
      when subject_type in ('student', 'lead') then public.has_permission('students.edit')
      when subject_type = 'employee'           then public.has_permission('hr.manage')
      else false
    end
  )
  with check (
    case
      when subject_type in ('student', 'lead') then public.has_permission('students.edit')
      when subject_type = 'employee'           then public.has_permission('hr.manage')
      else false
    end
  );

drop policy if exists person_documents_delete on public.person_documents;
create policy person_documents_delete on public.person_documents
  for delete
  using (
    case
      when subject_type in ('student', 'lead') then public.has_permission('students.edit')
      when subject_type = 'employee'           then public.has_permission('hr.manage')
      else false
    end
  );

-- --------------------------------------------------------------- Bucket ----
--
-- Private, like jag-learn-media and for the same reason: these are children's
-- records and employees' personnel files. Nothing is served directly; the server
-- mints a short-lived signed URL after checking the same permission the row
-- policy above checks.
--
-- allowed_mime_types is null on purpose — "any type of doc" was the requirement,
-- and a school will produce file types no allowlist written today would predict.
-- The 50 MiB cap is the real guard.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('person-documents', 'person-documents', false, 52428800, null)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No authenticated policies on storage.objects for this bucket. Reads and writes
-- go through the server with the service role, after a permission check.
drop policy if exists person_documents_objects_all on storage.objects;
drop policy if exists person_documents_objects_select on storage.objects;
drop policy if exists person_documents_public_select on storage.objects;

notify pgrst, 'reload schema';

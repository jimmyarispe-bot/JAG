-- Sprint 222 — JAG Evidence: authenticated read-only on durable tables
-- Forward-only. Writes (insert/update/delete) go through Next.js service-role APIs.
-- Prevents browser JWT clients from mutating lifecycle_status / status / paths.
-- Does not alter storage buckets, SELECT RLS, or AcademyOS documents.

-- Documents: drop authenticated write policies (SELECT from 220 remains).
drop policy if exists jag_evidence_documents_insert on public.jag_evidence_documents;
drop policy if exists jag_evidence_documents_update on public.jag_evidence_documents;
drop policy if exists jag_evidence_documents_delete on public.jag_evidence_documents;

-- Versions: drop authenticated write policies (SELECT from 220 remains).
drop policy if exists jag_evidence_versions_insert on public.jag_evidence_document_versions;
drop policy if exists jag_evidence_versions_update on public.jag_evidence_document_versions;
drop policy if exists jag_evidence_versions_delete on public.jag_evidence_document_versions;

comment on table public.jag_evidence_documents is
  'JAG Evidence Center durable documents. Org-scoped SELECT for authenticated; writes via service role only.';

comment on table public.jag_evidence_document_versions is
  'JAG Evidence document versions. Org-scoped SELECT for authenticated; writes via service role only.';

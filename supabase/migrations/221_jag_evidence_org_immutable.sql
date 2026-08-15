-- Sprint 221 — JAG Evidence Phase 2: organization_id immutability
-- Forward-only. Prevents moving evidence documents between organizations.
-- Does not alter RLS helpers, storage buckets, or AcademyOS documents.

create or replace function public.jag_evidence_document_organization_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.organization_id is distinct from old.organization_id then
    raise exception
      'jag_evidence_documents: organization_id is immutable after creation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_jag_evidence_document_org_immutable
  on public.jag_evidence_documents;
create trigger trg_jag_evidence_document_org_immutable
  before update of organization_id
  on public.jag_evidence_documents
  for each row
  execute function public.jag_evidence_document_organization_immutable();

comment on function public.jag_evidence_document_organization_immutable() is
  'Rejects any attempt to change jag_evidence_documents.organization_id after insert.';

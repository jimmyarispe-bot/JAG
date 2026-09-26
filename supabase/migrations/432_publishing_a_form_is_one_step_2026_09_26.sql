-- Publishing a form version is one step, or it is a broken public form.
--
-- WHY THIS IS A FUNCTION AND NOT THREE UPDATES FROM THE APPLICATION.
--
-- Migration 223 put a unique index on (form_id) where lifecycle = 'published'.
-- Exactly one published version per form - which is right, and which means
-- publishing is a SWAP: archive the old, promote the draft, move the pointer.
-- Three statements from the application have two gaps in them, and the first
-- gap is the dangerous one: between archiving the old version and promoting
-- the new, the organization has NO published form, and
-- loadPublishedInterestForm returns null to every family on the public page.
-- A failure in that window - a dropped connection, a timeout - leaves it that
-- way until somebody notices that the inquiry form has stopped existing.
--
-- Inside a function it is one transaction. Either the whole swap happens or
-- none of it does, and the public form is never without a version.
--
-- AUTHORIZATION LIVES IN THE APPLICATION, AND THE GRANT ENFORCES THAT.
-- Execute is revoked from authenticated and granted only to service_role, so
-- this cannot be called from a browser session at all. The only caller is the
-- server action behind /dashboard/admin/forms, which is gated on
-- FORM_BUILDER_ACCESS - Jimmy and Danni. Putting a second, differently-worded
-- permission check in here would be a rule that could drift from that one.
--
-- IT REFUSES RATHER THAN GUESSES. No draft, a draft that is not this form's,
-- a draft that is not actually a draft - each raises with a sentence naming
-- what was wrong, because a publish that silently does nothing is a person
-- who believes their wording is live when the old words are still going out.
--
-- Safe to re-run.

begin;

create or replace function public.publish_interest_form_draft(p_form_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft_id      uuid;
  v_published_id  uuid;
  v_lifecycle     text;
  v_version_number integer;
begin
  select draft_version_id, published_version_id
    into v_draft_id, v_published_id
    from public.admissions_interest_forms
   where id = p_form_id;

  if not found then
    raise exception 'No form with id %', p_form_id;
  end if;

  if v_draft_id is null then
    raise exception 'That form has no working draft, so there is nothing to publish';
  end if;

  select lifecycle, version_number
    into v_lifecycle, v_version_number
    from public.admissions_interest_form_versions
   where id = v_draft_id
     and form_id = p_form_id;

  if not found then
    raise exception 'The working draft does not belong to this form';
  end if;

  if v_lifecycle <> 'draft' then
    raise exception 'That version is already %, not a draft', v_lifecycle;
  end if;

  -- The old one first, because the unique index permits only one published
  -- version and this whole block is a single transaction anyway.
  if v_published_id is not null then
    update public.admissions_interest_form_versions
       set lifecycle = 'archived'
     where id = v_published_id
       and form_id = p_form_id;
  end if;

  update public.admissions_interest_form_versions
     set lifecycle    = 'published',
         published_at = now()
   where id = v_draft_id;

  update public.admissions_interest_forms
     set draft_version_id     = null,
         published_version_id = v_draft_id,
         updated_at           = now()
   where id = p_form_id;

  return v_version_number;
end;
$$;

comment on function public.publish_interest_form_draft(uuid) is
  'Publishes a form''s working draft: archives the previous published version, '
  'promotes the draft and moves the pointer, in one transaction. Callable only '
  'by service_role; authorization is the FORM_BUILDER_ACCESS gate on the screen.';

revoke all on function public.publish_interest_form_draft(uuid) from public;
revoke all on function public.publish_interest_form_draft(uuid) from anon;
revoke all on function public.publish_interest_form_draft(uuid) from authenticated;
grant execute on function public.publish_interest_form_draft(uuid) to service_role;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect one row: the function exists, is security definer, and authenticated
-- cannot execute it. "can_authenticated_execute = true" means the revoke did
-- not take and a signed-in user could publish a form from the browser.

select p.proname as function_name,
       p.prosecdef as security_definer,
       has_function_privilege('authenticated', p.oid, 'execute') as can_authenticated_execute,
       has_function_privilege('service_role', p.oid, 'execute') as can_service_role_execute
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname = 'publish_interest_form_draft';

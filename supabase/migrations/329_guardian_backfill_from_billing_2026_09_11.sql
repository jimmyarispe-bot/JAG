-- 329_guardian_backfill_from_billing_2026_09_11.sql
--
-- Make families reachable. Fill `guardians` from `families.billing_*`.
--
-- WHY THIS SOURCE AND NOT THE LEADS. The obvious source is
-- `admissions_leads.guardian_phone` — 302 of them. They cannot be reached:
-- `students.admissions_lead_id` is populated for exactly 2 of 94 families. The
-- students were imported from the campus databases rather than converted
-- through the funnel, so leads and families are two populations with an empty
-- join between them. Reconciling them is worth doing and is NOT this migration.
--
-- WHERE THINGS STAND. 94 families. 57 have no guardian row at all. Of the
-- guardians that exist, 20 have no phone. 17 families are reachable by phone
-- through the table that is supposed to hold parents. `families.billing_phone`
-- covers 73 and `billing_email` covers all 94.
--
-- THE HONEST COST. A billing contact is not a named person. `families` has
-- `family_name` and no given name, so a created guardian is
-- "Parent/Guardian <family name>" — plainly a placeholder, and deliberately not
-- something anyone will mistake for a real name. Every row this migration
-- touches is stamped in `communication_preferences`:
--
--   {"source": "families.billing", "needs_confirmation": true, ...}
--
-- so the rows are findable, auditable, and removable, and the go-live email
-- asking parents to confirm their details has an exact audience.
--
-- WHAT IT REFUSES TO DO. Where a family has several guardians, none marked
-- primary, and none with a phone, it writes nothing. Copying one number onto
-- two people asserts whose phone it is, and the data does not support that. Those
-- families are reported by the preview as `skip_ambiguous` and need a human.
--
-- Nothing is overwritten. Only blanks are filled.
--
-- Safe to re-run: the insert is guarded on the family having no guardian, and
-- the updates only touch null or empty values.

-- ---------------------------------------------------------------------------
-- 1) Fill blanks on guardians that already exist
-- ---------------------------------------------------------------------------
-- Target: the primary guardian, or the only guardian. Never several at once.

with target as (
  select g.id, f.billing_email, f.billing_phone
  from public.guardians g
  join public.families f on f.id = g.family_id
  where (nullif(trim(g.phone), '') is null or nullif(trim(g.email), '') is null)
    and (nullif(trim(f.billing_phone), '') is not null
      or nullif(trim(f.billing_email), '') is not null)
    and (
      g.is_primary
      or (select count(*) from public.guardians g2 where g2.family_id = g.family_id) = 1
    )
)
update public.guardians g
set
  phone = coalesce(nullif(trim(g.phone), ''), nullif(trim(t.billing_phone), '')),
  email = coalesce(nullif(trim(g.email), ''), nullif(trim(t.billing_email), '')),
  communication_preferences =
    coalesce(g.communication_preferences, '{}'::jsonb)
    || jsonb_build_object(
         'source', 'families.billing',
         'needs_confirmation', true,
         'backfilled_at', now()
       )
from target t
where g.id = t.id;

-- ---------------------------------------------------------------------------
-- 2) Create one guardian for families that have none
-- ---------------------------------------------------------------------------
-- `Parent/Guardian` as the given name is intentional. A plausible-looking
-- invented first name would be worse than an obvious placeholder: somebody
-- would eventually address a letter to it.
--
-- receives_billing is true because this contact came from the billing record
-- and demonstrably is the billing contact. relationship_to_student is left null
-- rather than guessed — "parent" is likely and unknown is true.

insert into public.guardians (
  family_id, first_name, last_name,
  email, phone,
  is_primary, receives_billing, receives_communications,
  communication_preferences
)
select
  f.id,
  'Parent/Guardian',
  coalesce(
    nullif(trim(regexp_replace(f.family_name, '\s+Family$', '', 'i')), ''),
    'Household'
  ),
  nullif(trim(f.billing_email), ''),
  nullif(trim(f.billing_phone), ''),
  true,
  true,
  true,
  jsonb_build_object(
    'source', 'families.billing',
    'needs_confirmation', true,
    'backfilled_at', now()
  )
from public.families f
where not exists (
    select 1 from public.guardians g where g.family_id = f.id
  )
  and (nullif(trim(f.billing_email), '') is not null
    or nullif(trim(f.billing_phone), '') is not null);

-- ---------------------------------------------------------------------------
-- 3) What changed, and what is still unreachable
-- ---------------------------------------------------------------------------
-- families_unreachable is the number that matters after this runs: families
-- with no phone anywhere. Those need a human, not a migration.

select
  (select count(*) from public.families) as families,
  (select count(distinct g.family_id) from public.guardians g
     where nullif(trim(g.phone), '') is not null)  as families_reachable_by_phone,
  (select count(distinct g.family_id) from public.guardians g
     where nullif(trim(g.email), '') is not null)  as families_reachable_by_email,
  (select count(*) from public.guardians
     where communication_preferences ->> 'source' = 'families.billing')
                                                   as rows_from_billing,
  (select count(*) from public.families f
     where not exists (
       select 1 from public.guardians g
       where g.family_id = f.id and nullif(trim(g.phone), '') is not null
     ))                                            as families_unreachable_by_phone;

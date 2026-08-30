-- 231_family_country.sql
--
-- A country on the household.
--
-- The roster is not all in Georgia and Florida: The Academy Virtual takes
-- students wherever they are, and an address with no country is only readable
-- by someone who already knows where the family lives. `state` and `zip_code`
-- keep their column names because renaming them would touch the importer, the
-- family profile and the parent RPC for no gain; the labels around them now
-- read "State / Province / Region" and "Postal code" instead.
--
-- `primary_address` stays free text on purpose. Every attempt to structure a
-- street address across countries ends in a form that cannot express a real
-- address somewhere, so the block is typed as the family writes it and only
-- the parts worth grouping by -- city, region, postal code, country -- are
-- separate.
--
-- Safe to re-run.

alter table public.families
  add column if not exists country text;

comment on column public.families.country is
  'ISO 3166-1 English country name, e.g. "United States", "Nigeria". Stored as '
  'the name rather than a code because nothing in the app decodes a code. '
  'Null means unknown, not domestic.';

-- Existing rows are deliberately left null. Backfilling every household to
-- "United States" would turn "we never asked" into a fact, and the families we
-- most need this for are exactly the ones a blanket backfill would get wrong.

-- ===========================================================================
-- DID THE MISSING MIGRATION NUMBERS EVER EXIST?
-- 14 September 2026. READ ONLY. ANSWERED — the result is recorded below.
-- ===========================================================================
--
-- WHY THIS WAS ASKED. The repo's migration numbering had 97 gaps, and all day
-- that meant the checkout could not be trusted as authority on the schema:
-- can_access_school had to be read from pg_policies rather than from a file, and
-- migration 350 used ALTER FUNCTION rather than CREATE OR REPLACE precisely
-- because retyping a body from this checkout might have reverted whatever the
-- missing files did.
--
-- 86 of those were recovered from C:\Users\jimmy\Downloads\jag-import\sql, where
-- they had been sitting since they were written: delivered to be pasted into the
-- SQL editor, applied to production, and never committed, because every ship
-- stages files by name and these were never named.
--
-- That left twelve: 157, 201-210, 213. Three local records were checked and none
-- had ever heard of them — the repo, supabase/baseline/manifest.json, and
-- baseline/evidence/migration-source-blobs.json. This asked the last witness.
--
-- ---------------------------------------------------------------------------
-- THE ANSWER, 14 September 2026:
--
--     never_recorded | matches_our_gap
--     ---------------+----------------
--     157            | true
--     201 .. 210     | true
--     213            | true
--
-- Twelve rows, every one of them ours. Production's own migration record has no
-- trace of these either, so they were never migrations. 201-213 are DOCUMENTATION
-- numbers — docs/jag/201_PREDICTIVE_INTELLIGENCE.md through
-- 213_DATA_PLANE_TENANT_ISOLATION.md — and doc numbering ran alongside migration
-- numbering. 157 is named once, in
-- docs/architecture/FINANCIAL_INTELLIGENCE_PHASE0_GL_SPEC.md, as a file that was
-- planned and never written.
--
-- THE REPO IS NOW A COMPLETE RECORD OF EVERY MIGRATION THAT HAS EVER RUN.
-- ---------------------------------------------------------------------------
--
-- ONE CAVEAT, so nobody over-reads this later. schema_migrations records only
-- what the Supabase CLI applied; its range ends at 223 because everything since
-- has been pasted into the SQL editor by hand, which does not register. So this
-- query proves the twelve were never applied THROUGH THE CLI in an era when the
-- CLI was being used and recorded 211 of its 223 neighbours. That is strong
-- evidence, not a tautology — but it is evidence about that era only, and it
-- cannot speak for anything after 223.

with recorded as (
  select distinct substring(coalesce(version, name) from '^[0-9]+')::int as n
  from supabase_migrations.schema_migrations
  where coalesce(version, name) ~ '^[0-9]+'
),
span as (select generate_series(1, (select max(n) from recorded)) as n)
select
  s.n as never_recorded,
  s.n in (157,201,202,203,204,205,206,207,208,209,210,213) as matches_our_gap
from span s
left join recorded r on r.n = s.n
where r.n is null
order by s.n;

-- Shape of the record, for context. Expect earliest 001, latest 223, total 211.
select
  min(version) as earliest,
  max(version) as latest,
  count(*)     as total
from supabase_migrations.schema_migrations;

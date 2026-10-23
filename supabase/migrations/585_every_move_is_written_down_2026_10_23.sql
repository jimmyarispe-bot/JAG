-- 585 — EVERY STAGE MOVE IS WRITTEN DOWN (23 October 2026)
--
-- Grace Gaudette is on Shadow Days Scheduled. Her history said New Inquiry
-- and nothing else. On 23 October, 197 of 358 leads had a current stage that
-- their history did not show; 6 of them had moved in the last fourteen days
-- (Maxson, Konnor, Cash, Ian Xavier, Journii, Grace).
--
-- The cause: history was written by the app, one call site at a time
-- (transitionLeadStage, recordInitialStage, skip-stage, the public inquiry
-- function). Every other path that sets lead_stage - bookings, scans, the
-- board - wrote nothing.
--
-- THE FIX: the database writes it. Any insert of a lead, and any change to
-- lead_stage, writes a history row. The app writers stay; a guard on the
-- history table drops a row that repeats one written in the last 30 seconds,
-- so the two never double up, whichever lands first. If the app's copy names
-- who made the move and the trigger's did not, the name is kept.

-- 1. The writer, on admissions_leads.
create or replace function public.log_admissions_lead_stage_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.admissions_lead_stage_history (lead_id, previous_stage, new_stage, changed_by, changed_at)
    values (new.id, null, new.lead_stage, auth.uid(), now());
  elsif new.lead_stage is distinct from old.lead_stage then
    insert into public.admissions_lead_stage_history (lead_id, previous_stage, new_stage, changed_by, changed_at)
    values (new.id, old.lead_stage, new.lead_stage, auth.uid(), now());
  end if;
  return null;
end;
$$;

drop trigger if exists trg_admissions_leads_stage_history on public.admissions_leads;
create trigger trg_admissions_leads_stage_history
after insert or update of lead_stage on public.admissions_leads
for each row execute function public.log_admissions_lead_stage_change();

-- 2. The guard, on admissions_lead_stage_history.
create or replace function public.dedupe_admissions_lead_stage_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing uuid;
begin
  -- The app row and the trigger row can arrive in the same instant.
  perform pg_advisory_xact_lock(hashtext('stage_history|' || new.lead_id::text));

  select h.id into v_existing
  from public.admissions_lead_stage_history h
  where h.lead_id = new.lead_id
    and h.new_stage is not distinct from new.new_stage
    and h.previous_stage is not distinct from new.previous_stage
    and h.changed_at > now() - interval '30 seconds'
  order by h.changed_at desc
  limit 1;

  if v_existing is null then
    return new;
  end if;

  if new.changed_by is not null then
    update public.admissions_lead_stage_history
       set changed_by = new.changed_by
     where id = v_existing and changed_by is null;
  end if;

  return null;  -- the move is already written down
end;
$$;

drop trigger if exists trg_admissions_lead_stage_history_dedupe on public.admissions_lead_stage_history;
create trigger trg_admissions_lead_stage_history_dedupe
before insert on public.admissions_lead_stage_history
for each row execute function public.dedupe_admissions_lead_stage_history();

revoke execute on function public.log_admissions_lead_stage_change() from public, anon, authenticated;
revoke execute on function public.dedupe_admissions_lead_stage_history() from public, anon, authenticated;

-- 3. Backfill: one row for every lead whose current stage the history does
-- not show, dated when the lead entered that stage. Who moved them is not
-- known and is left empty.
insert into public.admissions_lead_stage_history (lead_id, previous_stage, new_stage, changed_by, changed_at)
select l.id, last.new_stage, l.lead_stage, null, coalesce(l.stage_entered_at, l.updated_at, now())
from public.admissions_leads l
left join lateral (
  select h.new_stage
  from public.admissions_lead_stage_history h
  where h.lead_id = l.id
  order by h.changed_at desc
  limit 1
) last on true
where last.new_stage is distinct from l.lead_stage;

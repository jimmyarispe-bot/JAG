-- ============================================================================
-- 507 — THE MEETING IS WITH ME ONCE
-- 5 October 2026
--
-- Step 1b, the family's first letter, at The Academy Virtual and The Academy
-- HS. "with me" landed twice in one sentence, nine words apart:
--
--   was   The next step is to schedule a virtual meeting with me so you can
--         share your child's needs with me and the type of school environment
--         you want for {{student_first_name}}.
--
--   now   The next step is to schedule a virtual meeting so you can share
--         your child's needs with me and the type of school environment you
--         want for {{student_first_name}}.
--
-- Jimmy's revision, 5 October, his words exactly. The first "with me" goes,
-- the second stays — the sharing is what is personal, not the scheduling.
--
-- TWO ROWS, AND ONLY TWO. Migration 496 is the only place this sentence has
-- ever been written, and it wrote it to The Academy Virtual and The Academy
-- HS only. GA and FL have their own letter (493, a phone call) and the
-- network row is untouched by this file. The count is asserted below, so if
-- this migration finds any other number it refuses rather than guessing.
--
-- IDEMPOTENT. The update is filtered on the old wording, so running it twice
-- changes nothing the second time — and section 3 would then correctly report
-- zero rows carrying the old sentence.
-- ============================================================================


-- ── 1. Before ───────────────────────────────────────────────────────────────

select 'BEFORE'                                   as stage,
       coalesce(sc.name, '*** NETWORK ***')       as campus,
       case when t.body like '%a virtual meeting with me so you can share%'
            then 'says "with me" TWICE'
            else 'ok'
       end                                        as reads
  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key = 'inquiry_thank_you_email'
 order by sc.name nulls first;


-- ── 2. The revision ─────────────────────────────────────────────────────────

do $$
declare
  touched integer;
begin
  update public.admissions_communication_templates
     set body = replace(
                  body,
                  'a virtual meeting with me so you can share',
                  'a virtual meeting so you can share'
                ),
         updated_at = now()
   where template_key = 'inquiry_thank_you_email'
     and body like '%a virtual meeting with me so you can share%';

  get diagnostics touched = row_count;

  if touched <> 2 then
    raise exception
      'Expected 2 rows (The Academy Virtual, The Academy HS), changed % - stopping.',
      touched;
  end if;
end $$;


-- ── 3. Nothing anywhere still says it twice ─────────────────────────────────
--
-- Across every template in the platform, not just this one.

do $$
declare
  leftover integer;
begin
  select count(*) into leftover
    from public.admissions_communication_templates
   where body like '%a virtual meeting with me so you can share%';

  if leftover <> 0 then
    raise exception '% template(s) still say "with me" twice.', leftover;
  end if;
end $$;


-- ── 4. After — read the sentence itself ─────────────────────────────────────
--
-- WHAT GOOD LOOKS LIKE: both campuses ON, and the sentence below reads
-- "...schedule a virtual meeting so you can share your child's needs with
-- me and the type of school environment you want for {{student_first_name}}."

select 'AFTER'                                    as stage,
       coalesce(sc.name, '*** NETWORK ***')       as campus,
       case when t.is_active then 'ON' else 'off' end as state,
       t.trigger_event,
       substring(t.body from 'The next step is[^\n]*')  as the_sentence
  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key = 'inquiry_thank_you_email'
 order by sc.name nulls first;

-- 501_2e_asks_for_notes_not_an_outcome_2026_10_05.sql
--
-- One line in 2e, the "three attempts, no booking" letter to the school
-- leader. Jimmy, 5 October:
--
--   was   Record what came of the call here:
--   now   Record your notes of the conversation here.
--
-- WHY IT READS BETTER. "What came of the call" asks for a result, and the
-- page behind the link does ask for one - four buttons, They will schedule /
-- Not interested / Left message / No answer. But the thing a school leader
-- has just finished doing is a conversation, and the box she will actually
-- type into is a free-text note. The old line described the radio buttons;
-- this one describes what she has in her head when she opens it.
--
-- ALL FIVE ROWS. Four campus overrides, live, plus the network row that
-- nothing reads. The network row is updated too so the five do not drift -
-- the day a fifth campus exists it should not inherit a sentence we stopped
-- using.
--
-- NOTHING ELSE IN THE LETTER MOVES. The update is guarded on the exact old
-- line, so a row that has already been changed, or changed by hand, matches
-- nothing rather than being overwritten.
--
-- Safe to re-run.

begin;

do $$
declare
  touched integer;
begin
  update public.admissions_communication_templates
     set body = replace(
                  body,
                  'Record what came of the call here:',
                  'Record your notes of the conversation here.'
                ),
         updated_at = now()
   where template_key = 'staff_interest_meeting_no_response'
     and body like '%Record what came of the call here:%';

  get diagnostics touched = row_count;

  if touched = 0 then
    raise notice 'Nothing matched - the line has already been changed.';
  elsif touched <> 5 then
    raise exception
      'Expected 5 rows (4 campuses + the network row), changed % - read the verify before going further.',
      touched;
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT five rows and a count.
--
--   The Academy FL        his line    ON
--   The Academy GA        his line    ON
--   The Academy HS        his line    ON
--   The Academy Virtual   his line    ON
--   every campus          his line    off   <- the unread network row
--
--   COUNT still asking for an outcome: 0.
--
-- The `the_line` column prints the sentence itself, so this is read rather
-- than inferred.

select coalesce(sc.name, 'every campus')                       as applies_to,

       case
         when t.body like '%Record your notes of the conversation here.%'
              then 'his line'
         when t.body like '%Record what came of the call here:%'
              then '*** STILL THE OLD LINE ***'
         else 'other'
       end                                                     as says,

       case when t.is_active then 'ON' else 'off' end          as state,

       coalesce(
         substring(t.body from 'Record [a-z ]*(?:the conversation|the call) here[.:]'),
         '—'
       )                                                       as the_line

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key = 'staff_interest_meeting_no_response'

union all

select 'COUNT still asking for an outcome',
       count(*)::text,
       case when count(*) = 0 then 'every copy asks for notes'
            else '*** A ROW WAS MISSED ***' end,
       ''
  from public.admissions_communication_templates t
 where t.template_key = 'staff_interest_meeting_no_response'
   and t.body like '%Record what came of the call here:%'

 order by applies_to;

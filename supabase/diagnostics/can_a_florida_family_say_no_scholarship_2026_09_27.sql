-- Can a Florida family who has no scholarship actually submit?
--
-- Three FL questions - Step Up Award ID, the amount, and the award letter
-- upload - are all required and all shown when
--   fl_scholarship_program  is not  'none'.
--
-- The select's last choice READS "We are not using a scholarship". If its
-- stored VALUE is anything other than 'none', that rule is true for every
-- family, and a Florida family with no scholarship is required to produce an
-- award ID and an award letter that do not exist. They would fill in the
-- whole form and be refused at the last step with no way forward.
--
-- The label cannot answer this. Only the value can.
--
-- EXPECT: one row per choice. The last one's value must be exactly 'none'.

with live as (
  select v.definition
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
)
select o->>'label' as choice,
       o->>'value' as stored_value,
       case
         when o->>'value' = 'none' then 'ok - the rule matches this'
         when o->>'label' ilike '%not using%' then 'THE TRAP - rule says none, value says this'
         else '-'
       end as verdict
  from live, jsonb_array_elements(definition->'questions') q,
       jsonb_array_elements(q->'options') o
 where q->>'key' = 'fl_scholarship_program';

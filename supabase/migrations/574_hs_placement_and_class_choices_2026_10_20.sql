-- 574 - HS: what the parent asks for, what the school leader places, and
-- the 1:1 tutoring that prices by the day.
--
-- Jimmy, 20 October 2026: "with high school, heather/school leader was
-- supposed to be given options of the classes the student will attend. And be
-- able to choose the actual start date. Preferred and start are both shown to
-- heather/school leader. Parents are supposed to be given these options too.
-- That then needs to be included in the information sent to me."
--
-- The options, his words: "1) The HS Experience (Entrepreneurship, LitLab,
-- Earth Quest, Real-World Math) 2) Structured Literacy Class 3) Structured
-- Literacy 1:1 Tutoring 4) Math 1:1 Tutoring --- if structured literacy or
-- math tutoring the # of days per month needs to be asked/required for
-- tuition to be calculated"
--
-- Question: "Which classes do you want your student to attend?" (tapped).
-- A tutoring day costs "same as virtual": Structured Literacy $85, Math $50.
-- The $100 off The HS Experience: "no scratch the $100 discount" (9:31 PM).

begin;

update public.tuition_bundle_discounts set is_active = false
 where school_id = 'a1000000-0000-4000-8000-000000000003' and name = 'HS Experience bundle discount';

-- 1. What the school leader chose at Accept.
alter table public.admissions_leads
  add column if not exists placement_class_names text[],
  add column if not exists placement_sl_tutoring_days int check (placement_sl_tutoring_days is null or placement_sl_tutoring_days between 1 and 31),
  add column if not exists placement_math_tutoring_days int check (placement_math_tutoring_days is null or placement_math_tutoring_days between 1 and 31),
  add column if not exists actual_start_date date,
  add column if not exists placement_recorded_at timestamptz;

comment on column public.admissions_leads.placement_class_names is
  'HS options the school leader placed the child in at Accept, as the application words them. Migration 574.';
comment on column public.admissions_leads.actual_start_date is
  'Start date chosen by the school leader at Accept. The parent''s preferred date is the inquiry answer desired_start_date. Migration 574.';

-- 2. Tutoring by the day at HS.
update public.tuition_school_prices
   set offered_one_to_one = true,
       one_to_one_session_rate = 85.00,
       notes = coalesce(notes, '') || ' 1:1 tutoring $85/day at HS, same as Virtual (Jimmy, 20 Oct 2026).'
 where school_id = 'a1000000-0000-4000-8000-000000000003'
   and catalog_item_id = (select id from public.tuition_catalog_items where item_code = 'virtual_structured_literacy')
   and is_active;

insert into public.tuition_catalog_items (item_code, display_name, item_kind, provider_school_id, description, sort_order, is_active)
values ('hs_math_tutoring', 'Math 1:1 Tutoring', 'class', 'a1000000-0000-4000-8000-000000000003',
        'Priced by the day: $50 per day, same as Virtual (Jimmy, 20 Oct 2026).', 150, true)
on conflict do nothing;

insert into public.tuition_school_prices (school_id, catalog_item_id, standard_amount, billing_frequency, offered_one_to_one, one_to_one_session_rate, is_active, notes)
select 'a1000000-0000-4000-8000-000000000003', i.id, null, 'monthly', true, 50.00, true,
       'Tutoring only: days per month x $50.'
from public.tuition_catalog_items i
where i.item_code = 'hs_math_tutoring'
  and not exists (
    select 1 from public.tuition_school_prices p
    where p.catalog_item_id = i.id and p.school_id = 'a1000000-0000-4000-8000-000000000003');

-- 3. The application, v42.
do $$
declare n_pub int;
begin
  select v.version_number into n_pub
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id
  where v.id = f.published_version_id;
  if n_pub <> 41 then
    raise exception 'Refusing: version 41 is not the published version (found %).', n_pub;
  end if;
end $$;

update public.admissions_interest_form_versions v
   set lifecycle = 'archived'
 where v.version_number = 41 and v.lifecycle = 'published'
   and v.form_id = (select id from public.admissions_interest_forms);

with src as (
  select v.form_id, v.organization_id, v.schema_version, v.definition, v.version_number
  from public.admissions_interest_form_versions v
  where v.version_number = 41 and v.form_id = (select id from public.admissions_interest_forms)
),
hs_cond as (
  select jsonb_build_object('op','eq','path','school_id','value','a1000000-0000-4000-8000-000000000003') c
),
patched as (
  select s.*,
    jsonb_set(
      jsonb_set(s.definition, '{questions}', (
        select jsonb_agg(
                 case when q ->> 'key' = 'hs_additional_core_classes'
                   then q
                     || jsonb_build_object('label', 'Which classes do you want your student to attend?')
                     || jsonb_build_object('options', jsonb_build_array(
                          jsonb_build_object('label','The HS Experience (Entrepreneurship, LitLab, Earth Quest, Real-World Math)','value','The HS Experience (Entrepreneurship, LitLab, Earth Quest, Real-World Math)'),
                          jsonb_build_object('label','Structured Literacy Class','value','Structured Literacy Class'),
                          jsonb_build_object('label','Structured Literacy 1:1 Tutoring','value','Structured Literacy 1:1 Tutoring'),
                          jsonb_build_object('label','Math 1:1 Tutoring','value','Math 1:1 Tutoring')))
                   else q end
                 order by ord)
        from jsonb_array_elements(s.definition -> 'questions') with ordinality as t(q, ord)
      ) || jsonb_build_array(
        jsonb_build_object('key','hs_sl_tutoring_days','type','number','phase','application','order',51,'required',true,
          'label','Structured Literacy 1:1 Tutoring: how many days per month?','systemBinding',null,
          'visibleWhen', jsonb_build_object('all', jsonb_build_array((select c from hs_cond),
             jsonb_build_object('op','contains','path','hs_additional_core_classes','value','Structured Literacy 1:1 Tutoring')))),
        jsonb_build_object('key','hs_math_tutoring_days','type','number','phase','application','order',52,'required',true,
          'label','Math 1:1 Tutoring: how many days per month?','systemBinding',null,
          'visibleWhen', jsonb_build_object('all', jsonb_build_array((select c from hs_cond),
             jsonb_build_object('op','contains','path','hs_additional_core_classes','value','Math 1:1 Tutoring'))))
      )),
      '{sections}', (
        select jsonb_agg(
                 case when sec ->> 'key' = 'hs_detail'
                   then jsonb_set(sec, '{questionKeys}',
                          jsonb_build_array('hs_additional_core_classes','hs_sl_tutoring_days','hs_math_tutoring_days')
                          || coalesce((select jsonb_agg(k) from jsonb_array_elements(sec -> 'questionKeys') k
                                        where k #>> '{}' <> 'hs_additional_core_classes'), '[]'::jsonb))
                   else sec end
                 order by ord)
        from jsonb_array_elements(s.definition -> 'sections') with ordinality as t(sec, ord)
      )
    ) as new_definition
  from src s
)
insert into public.admissions_interest_form_versions
  (form_id, organization_id, version_number, lifecycle, schema_version,
   definition, content_hash, published_at, created_by)
select form_id, organization_id, version_number + 1, 'published', schema_version,
       new_definition, encode(digest(new_definition::text, 'sha256'), 'hex'), now(), null
from patched;

update public.admissions_interest_forms f
   set published_version_id = (
         select v.id from public.admissions_interest_form_versions v
         where v.form_id = f.id order by v.version_number desc limit 1),
       updated_at = now();

do $$
declare pub_ver int; n_opts int; n_days int; n_keys int;
begin
  select v.version_number,
         (select jsonb_array_length(q -> 'options') from jsonb_array_elements(v.definition -> 'questions') q
           where q ->> 'key' = 'hs_additional_core_classes'),
         (select count(*) from jsonb_array_elements(v.definition -> 'questions') q
           where q ->> 'key' in ('hs_sl_tutoring_days','hs_math_tutoring_days')),
         (select jsonb_array_length(sec -> 'questionKeys') from jsonb_array_elements(v.definition -> 'sections') sec
           where sec ->> 'key' = 'hs_detail')
    into pub_ver, n_opts, n_days, n_keys
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id
  where v.id = f.published_version_id;
  if pub_ver <> 42 or n_opts <> 4 or n_days <> 2 or n_keys <> 8 then
    raise exception 'Refusing: v% options % day-questions % hs_detail keys %.', pub_ver, n_opts, n_days, n_keys;
  end if;
end $$;

commit;

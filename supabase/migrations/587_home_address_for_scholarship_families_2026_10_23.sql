-- 587 - THE APPLICATION ASKS FOR THE HOME ADDRESS (v43).
--
-- Jimmy, 23 October 2026: "i need to be able to retrieve/see the parent's
-- physical address and resident address if US and using scholarship of any
-- kind. if we don't require this in the application then please create it"
--
-- It was not required. The inquiry form dropped its mailing address on
-- 14 September (migration 362, "this is where it should end"), and nothing
-- replaced it on the application.
--
-- APPLICATION ONLY. The new section declares no phase, which means
-- application-only (see InterestFormPhase) - the inquiry form is untouched.
--
-- WHO IS ASKED: the student legally resides in the US AND the family is using
-- any scholarship - a Florida Step Up programme other than "none", any GA
-- scholarship (Special Needs, GOAL, Academy-Based), or a state scholarship,
-- voucher or ESA from another state.
--
-- WHAT IS ASKED: the physical home address, then whether the student's legal
-- residence is the same address; if not, the residence address too.

begin;

do $$
declare n_pub int;
begin
  select v.version_number into n_pub
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id
  where v.id = f.published_version_id;
  if n_pub <> 42 then
    raise exception 'Refusing: version 42 is not the published version (found %).', n_pub;
  end if;
end $$;

update public.admissions_interest_form_versions v
   set lifecycle = 'archived'
 where v.version_number = 42 and v.lifecycle = 'published'
   and v.form_id = (select id from public.admissions_interest_forms);

with src as (
  select v.form_id, v.organization_id, v.schema_version, v.definition, v.version_number
  from public.admissions_interest_form_versions v
  where v.version_number = 42 and v.form_id = (select id from public.admissions_interest_forms)
),
cond as (
  select jsonb_build_object('all', jsonb_build_array(
    jsonb_build_object('op','eq','path','student_lives_in_us','value','Yes'),
    jsonb_build_object('any', jsonb_build_array(
      jsonb_build_object('all', jsonb_build_array(
        jsonb_build_object('op','exists','path','fl_scholarship_program'),
        jsonb_build_object('op','neq','path','fl_scholarship_program','value','none'))),
      jsonb_build_object('op','contains','path','ga_scholarships','value','ga_special_needs'),
      jsonb_build_object('op','contains','path','ga_scholarships','value','ga_goal'),
      jsonb_build_object('op','contains','path','ga_scholarships','value','academy_based'),
      jsonb_build_object('op','eq','path','state_funding_using','value','yes')
    ))
  )) c
),
different as (
  select jsonb_build_object('all', jsonb_build_array(
    jsonb_build_object('op','eq','path','residence_same_as_home','value','No'))) c
),
new_questions as (
  select jsonb_build_array(
    jsonb_build_object('key','home_street','type','text','label','Street Address','required',true,'order',200,'systemBinding',null),
    jsonb_build_object('key','home_line_2','type','text','label','Address Line 2','required',false,'order',201,'systemBinding',null),
    jsonb_build_object('key','home_city','type','text','label','City','required',true,'order',202,'systemBinding',null),
    jsonb_build_object('key','home_state','type','text','label','State','required',true,'order',203,'systemBinding',null),
    jsonb_build_object('key','home_postal_code','type','text','label','ZIP Code','required',true,'order',204,'systemBinding',null),
    jsonb_build_object('key','residence_same_as_home','type','select','label','Is this the same address as the student''s legal residence?',
      'required',true,'order',205,'systemBinding',null,
      'helpText','Your scholarship is tied to the student''s legal residence.',
      'options', jsonb_build_array(
        jsonb_build_object('label','Yes','value','Yes'),
        jsonb_build_object('label','No','value','No'))),
    jsonb_build_object('key','residence_street','type','text','label','Residence: Street Address','required',true,'order',206,'systemBinding',null,'visibleWhen',(select c from different)),
    jsonb_build_object('key','residence_line_2','type','text','label','Residence: Address Line 2','required',false,'order',207,'systemBinding',null,'visibleWhen',(select c from different)),
    jsonb_build_object('key','residence_city','type','text','label','Residence: City','required',true,'order',208,'systemBinding',null,'visibleWhen',(select c from different)),
    jsonb_build_object('key','residence_state','type','text','label','Residence: State','required',true,'order',209,'systemBinding',null,'visibleWhen',(select c from different)),
    jsonb_build_object('key','residence_postal_code','type','text','label','Residence: ZIP Code','required',true,'order',210,'systemBinding',null,'visibleWhen',(select c from different))
  ) q
),
patched as (
  select s.*,
    jsonb_set(
      jsonb_set(s.definition, '{questions}', (s.definition -> 'questions') || (select q from new_questions)),
      '{sections}', (s.definition -> 'sections') || jsonb_build_array(
        jsonb_build_object(
          'key','home_address',
          'title','Home Address',
          'description','Where the student lives. Required for scholarship families.',
          'order',12,
          'visibleWhen',(select c from cond),
          'questionKeys', jsonb_build_array('home_street','home_line_2','home_city','home_state','home_postal_code',
            'residence_same_as_home','residence_street','residence_line_2','residence_city','residence_state','residence_postal_code')
        ))
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
declare pub_ver int; n_q int; n_keys int;
begin
  select v.version_number,
         (select count(*) from jsonb_array_elements(v.definition -> 'questions') q
           where q ->> 'key' like 'home\_%' or q ->> 'key' like 'residence\_%'),
         (select jsonb_array_length(sec -> 'questionKeys') from jsonb_array_elements(v.definition -> 'sections') sec
           where sec ->> 'key' = 'home_address')
    into pub_ver, n_q, n_keys
  from public.admissions_interest_form_versions v
  join public.admissions_interest_forms f on f.id = v.form_id
  where v.id = f.published_version_id;
  if pub_ver <> 43 or n_q <> 11 or n_keys <> 11 then
    raise exception 'Refusing: v% address questions % section keys %.', pub_ver, n_q, n_keys;
  end if;
end $$;

commit;

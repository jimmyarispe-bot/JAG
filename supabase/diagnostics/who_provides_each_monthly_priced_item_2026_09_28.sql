-- Who PROVIDES each monthly-priced item, and does the ten-month assumption hold?
--
-- plan-builder.ts annualises a monthly price as amount x 10, and skips any line
-- whose provider is not the attending school ("owed school to school, not
-- billed to the family"). So x 10 is only ever applied to a line the family is
-- actually billed for - one where provider = attending school.
--
-- The question this answers: is there any such line at a campus whose school
-- year is NOT ten months? That, and only that, is a real mispricing.
--
-- READ ONLY. Nothing is written.

select case
         when ci.provider_school_id = tsp.school_id then 'BILLED TO FAMILY'
         else 'school to school - not billed'
       end                                   as how_it_is_billed,
       attending.name                        as attending_campus,
       provider.name                         as provider_campus,
       ci.item_code,
       ci.display_name,
       tsp.standard_amount                   as price_per_month,
       (extract(year  from sy.end_date) * 12 + extract(month from sy.end_date))
     - (extract(year  from sy.start_date) * 12 + extract(month from sy.start_date))
     + 1                                     as attending_campus_months,
       case
         when ci.provider_school_id <> tsp.school_id then 'fine - line is skipped before any multiplication'
         when (extract(year  from sy.end_date) * 12 + extract(month from sy.end_date))
            - (extract(year  from sy.start_date) * 12 + extract(month from sy.start_date))
            + 1 = 10 then 'fine - ten month year, x 10 is correct'
         else 'MISPRICED - billed to family at x 10 on a year that is not ten months'
       end                                   as verdict,
       case
         when ci.provider_school_id = tsp.school_id
          and (extract(year  from sy.end_date) * 12 + extract(month from sy.end_date))
            - (extract(year  from sy.start_date) * 12 + extract(month from sy.start_date))
            + 1 <> 10
         then tsp.standard_amount
              * (((extract(year from sy.end_date) * 12 + extract(month from sy.end_date))
                - (extract(year from sy.start_date) * 12 + extract(month from sy.start_date))
                + 1) - 10)
         else 0
       end                                   as dollars_a_year_understated
  from public.tuition_school_prices tsp
  join public.schools attending        on attending.id = tsp.school_id
  join public.tuition_catalog_items ci on ci.id = tsp.catalog_item_id
  left join public.schools provider    on provider.id = ci.provider_school_id
  left join public.school_years sy     on sy.school_id = tsp.school_id and sy.is_current
 where tsp.is_active
   and tsp.billing_frequency = 'monthly'
   and tsp.standard_amount is not null
 order by (case when ci.provider_school_id = tsp.school_id then 0 else 1 end),
          attending.name,
          ci.item_code;

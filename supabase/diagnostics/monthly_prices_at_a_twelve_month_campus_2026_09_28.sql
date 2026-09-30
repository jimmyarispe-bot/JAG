-- Does the ten-months-per-year assumption bite at FL and GA?
--
-- plan-builder.ts annualises a monthly catalogue price as amount x 10.
-- That is right at The Academy Virtual and The Academy HS, whose year runs
-- 1 Aug to 31 May. The Academy FL and The Academy GA run 1 Jun to 31 May -
-- twelve months - so a monthly price there is annualised two months short.
--
-- READ ONLY. Nothing is written.

select sc.name                       as school,
       sy.start_date,
       sy.end_date,
       (extract(year  from sy.end_date) * 12 + extract(month from sy.end_date))
     - (extract(year  from sy.start_date) * 12 + extract(month from sy.start_date))
     + 1                             as months_in_year,
       ci.item_code,
       ci.display_name,
       tsp.billing_frequency,
       tsp.standard_amount           as price_per_period,
       tsp.standard_amount * 10      as annualised_now,
       tsp.standard_amount
         * ((extract(year from sy.end_date) * 12 + extract(month from sy.end_date))
          - (extract(year from sy.start_date) * 12 + extract(month from sy.start_date))
          + 1)                       as annualised_by_the_campus_year,
       tsp.standard_amount
         * (((extract(year from sy.end_date) * 12 + extract(month from sy.end_date))
           - (extract(year from sy.start_date) * 12 + extract(month from sy.start_date))
           + 1) - 10)                as difference
  from public.tuition_school_prices tsp
  join public.schools sc            on sc.id = tsp.school_id
  join public.tuition_catalog_items ci on ci.id = tsp.catalog_item_id
  left join public.school_years sy  on sy.school_id = sc.id and sy.is_current
 where tsp.is_active
   and tsp.billing_frequency = 'monthly'
 order by sc.name, ci.item_code;

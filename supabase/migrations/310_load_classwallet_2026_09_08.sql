-- 310_load_classwallet_2026_09_08.sql
--
-- The 40 settled ClassWallet orders, from four portal exports pulled
-- 8 September 2026. Requires 309.
--
--   ClassWallet AZ  - The Academy Virtual   28 orders   net $49,885.74
--   ClassWallet NC  - The Academy Virtual   10 orders   net $14,649.36
--   ClassWallet AR  - The Academy Virtual    1 order    net  $1,537.50
--   ClassWallet AR  - The Academy HS         1 order    net    $865.73
--                                           --                ---------
--                                           40 orders   net $66,938.33
--
-- plus $1,404.39 of platform fees, against $68,342.72 debited from families'
-- accounts. Every row was generated directly from the CSVs, not transcribed,
-- and every row satisfies net + fee = gross before it reaches the constraint
-- that enforces it.
--
-- $66,072.60 of the $66,938.33 is The Academy Virtual.
--
-- NOTHING IS MATCHED TO A STUDENT. All 40 rows land at match_status =
-- 'unmatched' with student_id null, holding nine distinct payer names between
-- them. That is the honest state: the exports carry a name and no identifier,
-- and this codebase has twice been damaged by treating a name as an identifier.
-- The matching query at the foot of this script shows the candidates; a person
-- decides, and 311 will record the decisions.
--
-- The money is real and countable now regardless. Revenue does not wait on
-- attribution.
--
-- SAFE TO RE-RUN - every insert is ON CONFLICT DO NOTHING against
-- (funder_account_id, external_order_id).

begin;

do $$
declare
  v_vi uuid; v_hs uuid;
  v_az uuid; v_nc uuid; v_arv uuid; v_arh uuid;
begin
  select id into v_vi from public.schools where name = 'The Academy Virtual';
  select id into v_hs from public.schools where name = 'The Academy HS';

  if v_vi is null or v_hs is null then
    raise exception 'School lookup failed (Virtual=%, HS=%). Run: select id, name from public.schools;', v_vi, v_hs;
  end if;

  -- -------------------------------------------------------------------------
  -- The four portal logins. One per entity per state - this is what attributes
  -- the money, because the export files do not.
  -- -------------------------------------------------------------------------

  insert into public.funder_accounts (platform, program_code, school_id, account_label, notes)
  values
    ('classwallet', 'az_esa',      v_vi, 'ClassWallet AZ - The Academy Virtual',
     'Arizona ESA. No HS account exists yet. Every AZ order therefore belongs to Virtual.'),
    ('classwallet', 'nc_esa_plus', v_vi, 'ClassWallet NC - The Academy Virtual',
     'North Carolina ESA+. No HS account exists yet.'),
    ('classwallet', 'ar_efa',      v_vi, 'ClassWallet AR - The Academy Virtual',
     'Arkansas EFA, Virtual login.'),
    ('classwallet', 'ar_efa',      v_hs, 'ClassWallet AR - The Academy HS',
     'Arkansas EFA, HS login. One student as at 2026-09-08.')
  on conflict (platform, program_code, school_id) do nothing;

  select id into v_az  from public.funder_accounts
   where platform='classwallet' and program_code='az_esa'      and school_id=v_vi;
  select id into v_nc  from public.funder_accounts
   where platform='classwallet' and program_code='nc_esa_plus' and school_id=v_vi;
  select id into v_arv from public.funder_accounts
   where platform='classwallet' and program_code='ar_efa'      and school_id=v_vi;
  select id into v_arh from public.funder_accounts
   where platform='classwallet' and program_code='ar_efa'      and school_id=v_hs;

  if v_az is null or v_nc is null or v_arv is null or v_arh is null then
    raise exception 'funder_accounts lookup failed (az=%, nc=%, ar_virtual=%, ar_hs=%). Did 309 run?',
      v_az, v_nc, v_arv, v_arh;
  end if;

  -- ClassWallet AZ - The Academy Virtual -- 28 orders, net $49,885.74

  insert into public.funder_disbursements (
    funder_account_id, external_order_id, external_transaction_id, external_invoice_ref,
    payer_account_name, award_period, gross_amount, fee_amount, net_amount,
    approved_on, settled_on, status, declared_school, source_file, notes, raw
  ) values
    (v_az, $t$16868397$t$, $t$240528165538UIL$t$, $t$100141$t$,
     $t$Jaxon Corduan$t$, $t$Arizona - ESA$t$, 2092.52, 52.31, 2040.21,
     date '2024-05-21', date '2024-05-31', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"16868397","User Name":"Jaxon Corduan","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2024-05-21","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100141","Distribution Name":"Arizona \u2013 ESA","Payment Amount":"$2040.21","Fee":"$52.31","Total":"$2092.52","Status":"Settled","Last Update":"2024-05-31","Transaction ID":"240528165538UIL"}$t$::jsonb),
    (v_az, $t$17924275$t$, $t$240814164244XNR$t$, $t$100170$t$,
     $t$Kennedy Stone$t$, $t$Arizona - ESA$t$, 677.66, 13.55, 664.11,
     date '2024-08-08', date '2024-08-19', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"17924275","User Name":"Kennedy Stone","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2024-08-08","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100170","Distribution Name":"Arizona \u2013 ESA","Payment Amount":"$664.11","Fee":"$13.55","Total":"$677.66","Status":"Settled","Last Update":"2024-08-19","Transaction ID":"240814164244XNR"}$t$::jsonb),
    (v_az, $t$17926439$t$, $t$240813105233WU8$t$, $t$100152$t$,
     $t$Jaxon Corduan$t$, $t$Arizona - ESA$t$, 2092.52, 41.85, 2050.67,
     date '2024-08-08', date '2024-08-19', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"17926439","User Name":"Jaxon Corduan","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2024-08-08","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100152","Distribution Name":"Arizona \u2013 ESA","Payment Amount":"$2050.67","Fee":"$41.85","Total":"$2092.52","Status":"Settled","Last Update":"2024-08-19","Transaction ID":"240813105233WU8"}$t$::jsonb),
    (v_az, $t$17937699$t$, $t$240814164420AUA$t$, $t$100171-R-0001$t$,
     $t$Kennedy Stone$t$, $t$Arizona - ESA$t$, 677.66, 13.55, 664.11,
     date '2024-08-09', date '2024-08-19', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"17937699","User Name":"Kennedy Stone","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2024-08-09","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100171-R-0001","Distribution Name":"Arizona \u2013 ESA","Payment Amount":"$664.11","Fee":"$13.55","Total":"$677.66","Status":"Settled","Last Update":"2024-08-19","Transaction ID":"240814164420AUA"}$t$::jsonb),
    (v_az, $t$17937725$t$, $t$240814164420BDV$t$, $t$100171-R-0002$t$,
     $t$Kennedy Stone$t$, $t$Arizona - ESA$t$, 677.66, 13.55, 664.11,
     date '2024-08-09', date '2024-08-19', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"17937725","User Name":"Kennedy Stone","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2024-08-09","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100171-R-0002","Distribution Name":"Arizona \u2013 ESA","Payment Amount":"$664.11","Fee":"$13.55","Total":"$677.66","Status":"Settled","Last Update":"2024-08-19","Transaction ID":"240814164420BDV"}$t$::jsonb),
    (v_az, $t$19972927$t$, $t$241120060142GCG$t$, null,
     $t$Kennedy Stone$t$, $t$Arizona - ESA$t$, 600.00, 12.00, 588.00,
     date '2024-11-18', date '2024-11-21', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"19972927","User Name":"Kennedy Stone","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2024-11-18","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$588","Fee":"$12","Total":"$600","Status":"Settled","Last Update":"2024-11-21","Transaction ID":"241120060142GCG"}$t$::jsonb),
    (v_az, $t$19784637$t$, $t$241202170054TTI$t$, $t$100200$t$,
     $t$Jaxon Corduan$t$, $t$Arizona - ESA$t$, 2092.52, 41.85, 2050.67,
     date '2024-11-29', date '2024-12-03', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"19784637","User Name":"Jaxon Corduan","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2024-11-29","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100200","Distribution Name":"Arizona - ESA","Payment Amount":"$2050.67","Fee":"$41.85","Total":"$2092.52","Status":"Settled","Last Update":"2024-12-03","Transaction ID":"241202170054TTI"}$t$::jsonb),
    (v_az, $t$19972809$t$, $t$241209060052342$t$, $t$100204$t$,
     $t$Kennedy Stone$t$, $t$Arizona - ESA$t$, 2006.00, 40.12, 1965.88,
     date '2024-12-05', date '2024-12-10', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"19972809","User Name":"Kennedy Stone","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2024-12-05","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100204","Distribution Name":"Arizona - ESA","Payment Amount":"$1965.88","Fee":"$40.12","Total":"$2006","Status":"Settled","Last Update":"2024-12-10","Transaction ID":"241209060052342"}$t$::jsonb),
    (v_az, $t$21388921$t$, $t$250124123121IGR$t$, $t$100201$t$,
     $t$Jaxon Corduan$t$, $t$Arizona - ESA$t$, 2092.52, 41.85, 2050.67,
     date '2025-01-22', date '2025-01-25', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"21388921","User Name":"Jaxon Corduan","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2025-01-22","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100201","Distribution Name":"Arizona - ESA","Payment Amount":"$2050.67","Fee":"$41.85","Total":"$2092.52","Status":"Settled","Last Update":"2025-01-25","Transaction ID":"250124123121IGR"}$t$::jsonb),
    (v_az, $t$21717185$t$, $t$250130123049HAS$t$, null,
     $t$Kennedy Stone$t$, $t$Arizona - ESA$t$, 1361.02, 27.22, 1333.80,
     date '2025-01-28', date '2025-01-31', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"21717185","User Name":"Kennedy Stone","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2025-01-28","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$1333.8","Fee":"$27.22","Total":"$1361.02","Status":"Settled","Last Update":"2025-01-31","Transaction ID":"250130123049HAS"}$t$::jsonb),
    (v_az, $t$22220631$t$, $t$250224161511QVV$t$, null,
     $t$Lauryn Allen$t$, $t$Arizona - ESA$t$, 2111.00, 42.22, 2068.78,
     date '2025-02-20', date '2025-02-25', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"22220631","User Name":"Lauryn Allen","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2025-02-20","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$2068.78","Fee":"$42.22","Total":"$2111","Status":"Settled","Last Update":"2025-02-25","Transaction ID":"250224161511QVV"}$t$::jsonb),
    (v_az, $t$22220643$t$, $t$250224161615YT0$t$, null,
     $t$Lauryn Allen$t$, $t$Arizona - ESA$t$, 2111.00, 42.22, 2068.78,
     date '2025-02-20', date '2025-02-25', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"22220643","User Name":"Lauryn Allen","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2025-02-20","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$2068.78","Fee":"$42.22","Total":"$2111","Status":"Settled","Last Update":"2025-02-25","Transaction ID":"250224161615YT0"}$t$::jsonb),
    (v_az, $t$23325171$t$, $t$250424113844VHE$t$, $t$100202$t$,
     $t$Jaxon Corduan$t$, $t$Arizona - ESA$t$, 2092.52, 41.85, 2050.67,
     date '2025-04-22', date '2025-04-25', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"23325171","User Name":"Jaxon Corduan","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2025-04-22","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100202","Distribution Name":"Arizona - ESA","Payment Amount":"$2050.67","Fee":"$41.85","Total":"$2092.52","Status":"Settled","Last Update":"2025-04-25","Transaction ID":"250424113844VHE"}$t$::jsonb),
    (v_az, $t$26467799$t$, $t$251001113448FS9$t$, null,
     $t$Lauryn Allen$t$, $t$Arizona - ESA$t$, 4220.00, 84.40, 4135.60,
     date '2025-09-29', date '2025-10-02', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"26467799","User Name":"Lauryn Allen","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2025-09-29","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$4135.6","Fee":"$84.4","Total":"$4220","Status":"Settled","Last Update":"2025-10-02","Transaction ID":"251001113448FS9"}$t$::jsonb),
    (v_az, $t$27378305$t$, $t$251107113221KCX$t$, null,
     $t$Lauryn Allen$t$, $t$Arizona - ESA$t$, 2205.44, 44.11, 2161.33,
     date '2025-11-05', date '2025-11-08', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"27378305","User Name":"Lauryn Allen","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2025-11-05","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$2161.33","Fee":"$44.11","Total":"$2205.44","Status":"Settled","Last Update":"2025-11-08","Transaction ID":"251107113221KCX"}$t$::jsonb),
    (v_az, $t$28739429$t$, $t$251222130248RUB$t$, $t$100256$t$,
     $t$Samuel Johns$t$, $t$Arizona - ESA$t$, 102.04, 2.04, 100.00,
     date '2025-12-19', date '2025-12-23', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"28739429","User Name":"Samuel Johns","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2025-12-19","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100256","Distribution Name":"Arizona - ESA","Payment Amount":"$100","Fee":"$2.04","Total":"$102.04","Status":"Settled","Last Update":"2025-12-23","Transaction ID":"251222130248RUB"}$t$::jsonb),
    (v_az, $t$28670733$t$, $t$251226120847OKE$t$, null,
     $t$Abigail Allen$t$, $t$Arizona - ESA$t$, 2272.91, 45.46, 2227.45,
     date '2025-12-24', date '2025-12-27', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"28670733","User Name":"Abigail Allen","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2025-12-24","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$2227.45","Fee":"$45.46","Total":"$2272.91","Status":"Settled","Last Update":"2025-12-27","Transaction ID":"251226120847OKE"}$t$::jsonb),
    (v_az, $t$29094699$t$, $t$260112123147OSR$t$, $t$000006$t$,
     $t$Samuel Johns$t$, $t$Arizona - ESA$t$, 1782.50, 35.65, 1746.85,
     date '2026-01-09', date '2026-01-13', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"29094699","User Name":"Samuel Johns","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2026-01-09","Est. Timeframe":"2-10 Business days","Invoice/Quote":"#000006","Distribution Name":"Arizona - ESA","Payment Amount":"$1746.85","Fee":"$35.65","Total":"$1782.5","Status":"Settled","Last Update":"2026-01-13","Transaction ID":"260112123147OSR"}$t$::jsonb),
    (v_az, $t$28958417$t$, $t$260116103415XYG$t$, null,
     $t$Kingstyn Allen$t$, $t$Arizona - ESA$t$, 2026.04, 40.52, 1985.52,
     date '2026-01-14', date '2026-01-17', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"28958417","User Name":"Kingstyn Allen","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2026-01-14","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$1985.52","Fee":"$40.52","Total":"$2026.04","Status":"Settled","Last Update":"2026-01-17","Transaction ID":"260116103415XYG"}$t$::jsonb),
    (v_az, $t$29468273$t$, $t$260123160037CUB$t$, $t$100271-R-0001$t$,
     $t$Samuel Johns$t$, $t$Arizona - ESA$t$, 1802.33, 36.05, 1766.28,
     date '2026-01-21', date '2026-01-24', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"29468273","User Name":"Samuel Johns","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2026-01-21","Est. Timeframe":"2-10 Business days","Invoice/Quote":"#100271-R-0001","Distribution Name":"Arizona - ESA","Payment Amount":"$1766.28","Fee":"$36.05","Total":"$1802.33","Status":"Settled","Last Update":"2026-01-24","Transaction ID":"260123160037CUB"}$t$::jsonb),
    (v_az, $t$29711001$t$, $t$260206100049TM1$t$, null,
     $t$Lauryn Allen$t$, $t$Arizona - ESA$t$, 2157.22, 43.14, 2114.08,
     date '2026-02-03', date '2026-02-07', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"29711001","User Name":"Lauryn Allen","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2026-02-03","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$2114.08","Fee":"$43.14","Total":"$2157.22","Status":"Settled","Last Update":"2026-02-07","Transaction ID":"260206100049TM1"}$t$::jsonb),
    (v_az, $t$29711217$t$, $t$260206100234BIM$t$, null,
     $t$Abigail Allen$t$, $t$Arizona - ESA$t$, 2272.91, 45.46, 2227.45,
     date '2026-02-03', date '2026-02-07', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"29711217","User Name":"Abigail Allen","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2026-02-03","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$2227.45","Fee":"$45.46","Total":"$2272.91","Status":"Settled","Last Update":"2026-02-07","Transaction ID":"260206100234BIM"}$t$::jsonb),
    (v_az, $t$29711941$t$, $t$260206100209RY5$t$, null,
     $t$Kingstyn Allen$t$, $t$Arizona - ESA$t$, 2026.04, 40.52, 1985.52,
     date '2026-02-03', date '2026-02-07', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"29711941","User Name":"Kingstyn Allen","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2026-02-03","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$1985.52","Fee":"$40.52","Total":"$2026.04","Status":"Settled","Last Update":"2026-02-07","Transaction ID":"260206100209RY5"}$t$::jsonb),
    (v_az, $t$30317299$t$, $t$2602240807501S6$t$, $t$100271-R-0002$t$,
     $t$Samuel Johns$t$, $t$Arizona - ESA$t$, 1802.33, 36.05, 1766.28,
     date '2026-02-21', date '2026-02-25', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"30317299","User Name":"Samuel Johns","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2026-02-21","Est. Timeframe":"2-10 Business days","Invoice/Quote":"#100271-R-0002","Distribution Name":"Arizona - ESA","Payment Amount":"$1766.28","Fee":"$36.05","Total":"$1802.33","Status":"Settled","Last Update":"2026-02-25","Transaction ID":"2602240807501S6"}$t$::jsonb),
    (v_az, $t$30987575$t$, $t$260323103251823$t$, $t$100271-R-0003$t$,
     $t$Samuel Johns$t$, $t$Arizona - ESA$t$, 1802.33, 36.05, 1766.28,
     date '2026-03-21', date '2026-03-24', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"30987575","User Name":"Samuel Johns","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2026-03-21","Est. Timeframe":"2-10 Business days","Invoice/Quote":"#100271-R-0003","Distribution Name":"Arizona - ESA","Payment Amount":"$1766.28","Fee":"$36.05","Total":"$1802.33","Status":"Settled","Last Update":"2026-03-24","Transaction ID":"260323103251823"}$t$::jsonb),
    (v_az, $t$31982571$t$, $t$260429120504MA8$t$, null,
     $t$Lauryn Allen$t$, $t$Arizona - ESA$t$, 1953.14, 39.06, 1914.08,
     date '2026-04-27', date '2026-04-30', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"31982571","User Name":"Lauryn Allen","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2026-04-27","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$1914.08","Fee":"$39.06","Total":"$1953.14","Status":"Settled","Last Update":"2026-04-30","Transaction ID":"260429120504MA8"}$t$::jsonb),
    (v_az, $t$33766687$t$, $t$260727173655LU9$t$, null,
     $t$Samuel Johns$t$, $t$Arizona - ESA$t$, 1902.33, 38.05, 1864.28,
     date '2026-07-24', date '2026-07-28', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"33766687","User Name":"Samuel Johns","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2026-07-24","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$1864.28","Fee":"$38.05","Total":"$1902.33","Status":"Settled","Last Update":"2026-07-28","Transaction ID":"260727173655LU9"}$t$::jsonb),
    (v_az, $t$34857619$t$, $t$2608241631401L0$t$, null,
     $t$Samuel Johns$t$, $t$Arizona - ESA$t$, 1902.33, 38.05, 1864.28,
     date '2026-08-21', date '2026-08-25', $t$settled$t$, null, $t$az.order.csv$t$, null,
     $t${"Order ID":"34857619","User Name":"Samuel Johns","Organization":"Arizona Department of Education","State":"AZ","School":"N/A","Payment Approval Date":"2026-08-21","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"Arizona - ESA","Payment Amount":"$1864.28","Fee":"$38.05","Total":"$1902.33","Status":"Settled","Last Update":"2026-08-25","Transaction ID":"2608241631401L0"}$t$::jsonb)
  on conflict (funder_account_id, external_order_id) do nothing;


  -- ClassWallet NC - The Academy Virtual -- 10 orders, net $14,649.36

  insert into public.funder_disbursements (
    funder_account_id, external_order_id, external_transaction_id, external_invoice_ref,
    payer_account_name, award_period, gross_amount, fee_amount, net_amount,
    approved_on, settled_on, status, declared_school, source_file, notes, raw
  ) values
    (v_nc, $t$27528057$t$, $t$2.5112E+14$t$, $t$1099$t$,
     $t$Jelina Augustave$t$, $t$ESA+ 25-26$t$, 1500.00, 37.50, 1462.50,
     date '2025-11-18', date '2025-11-21', $t$settled$t$, null, $t$nc.virtual.order.csv$t$, $t$Transaction ID arrived from the portal as scientific notation (2.5112E+14); the true value was destroyed by the export. Order ID is the key, so nothing is lost.$t$,
     $t${"Order ID":"27528057","User Name":"Jelina Augustave","Organization":"North Carolina State Education Assistance Authority","State":"NC","School":"N/A","Payment Approval Date":"11/18/2025","Est. Timeframe":"2-10 Business days","Invoice/Quote":"1099","Distribution Name":"ESA+ 25-26","Payment Amount":"$1,462.50","Fee":"$37.50","Total":"$1,500","Status":"Settled","Last Update":"11/21/2025","Transaction ID":"2.5112E+14"}$t$::jsonb),
    (v_nc, $t$28233451$t$, $t$251203113657CDN$t$, $t$1119$t$,
     $t$Jelina Augustave$t$, $t$ESA+ 25-26$t$, 1500.00, 37.50, 1462.50,
     date '2025-12-01', date '2025-12-04', $t$settled$t$, null, $t$nc.virtual.order.csv$t$, null,
     $t${"Order ID":"28233451","User Name":"Jelina Augustave","Organization":"North Carolina State Education Assistance Authority","State":"NC","School":"N/A","Payment Approval Date":"12/1/2025","Est. Timeframe":"2-10 Business days","Invoice/Quote":"1119","Distribution Name":"ESA+ 25-26","Payment Amount":"$1,462.50","Fee":"$37.50","Total":"$1,500","Status":"Settled","Last Update":"12/4/2025","Transaction ID":"251203113657CDN"}$t$::jsonb),
    (v_nc, $t$28318161$t$, $t$251204130509BO8$t$, $t$1121$t$,
     $t$Jelina Augustave$t$, $t$ESA+ 25-26$t$, 1500.00, 37.50, 1462.50,
     date '2025-12-02', date '2025-12-05', $t$settled$t$, null, $t$nc.virtual.order.csv$t$, null,
     $t${"Order ID":"28318161","User Name":"Jelina Augustave","Organization":"North Carolina State Education Assistance Authority","State":"NC","School":"N/A","Payment Approval Date":"12/2/2025","Est. Timeframe":"2-10 Business days","Invoice/Quote":"1121","Distribution Name":"ESA+ 25-26","Payment Amount":"$1,462.50","Fee":"$37.50","Total":"$1,500","Status":"Settled","Last Update":"12/5/2025","Transaction ID":"251204130509BO8"}$t$::jsonb),
    (v_nc, $t$29008013$t$, $t$2601091008071TT$t$, null,
     $t$Jelina Augustave$t$, $t$ESA+ 25-26$t$, 1300.00, 32.50, 1267.50,
     date '2026-01-07', date '2026-01-10', $t$settled$t$, null, $t$nc.virtual.order.csv$t$, null,
     $t${"Order ID":"29008013","User Name":"Jelina Augustave","Organization":"North Carolina State Education Assistance Authority","State":"NC","School":"N/A","Payment Approval Date":"1/7/2026","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"ESA+ 25-26","Payment Amount":"$1,267.50","Fee":"$32.50","Total":"$1,300","Status":"Settled","Last Update":"1/10/2026","Transaction ID":"2601091008071TT"}$t$::jsonb),
    (v_nc, $t$30313075$t$, $t$260225123444QWN$t$, $t$100274-R-0001$t$,
     $t$Jelina Augustave$t$, $t$ESA+ 25-26$t$, 1537.50, 38.44, 1499.06,
     date '2026-02-23', date '2026-02-26', $t$settled$t$, null, $t$nc.virtual.order.csv$t$, null,
     $t${"Order ID":"30313075","User Name":"Jelina Augustave","Organization":"North Carolina State Education Assistance Authority","State":"NC","School":"N/A","Payment Approval Date":"2/23/2026","Est. Timeframe":"2-10 Business days","Invoice/Quote":"#100274-R-0001","Distribution Name":"ESA+ 25-26","Payment Amount":"$1,499.06","Fee":"$38.44","Total":"$1,537.50","Status":"Settled","Last Update":"2/26/2026","Transaction ID":"260225123444QWN"}$t$::jsonb),
    (v_nc, $t$31066883$t$, $t$260330150437J8Y$t$, $t$100274-R-0002$t$,
     $t$Jelina Augustave$t$, $t$ESA+ 25-26$t$, 1537.50, 38.44, 1499.06,
     date '2026-03-26', date '2026-03-31', $t$settled$t$, null, $t$nc.virtual.order.csv$t$, null,
     $t${"Order ID":"31066883","User Name":"Jelina Augustave","Organization":"North Carolina State Education Assistance Authority","State":"NC","School":"N/A","Payment Approval Date":"3/26/2026","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100274-R-0002","Distribution Name":"ESA+ 25-26","Payment Amount":"$1,499.06","Fee":"$38.44","Total":"$1,537.50","Status":"Settled","Last Update":"3/31/2026","Transaction ID":"260330150437J8Y"}$t$::jsonb),
    (v_nc, $t$31829027$t$, $t$260501110341WJE$t$, $t$100286$t$,
     $t$Jelina Augustave$t$, $t$ESA+ 25-26$t$, 1537.50, 38.44, 1499.06,
     date '2026-04-29', date '2026-05-02', $t$settled$t$, null, $t$nc.virtual.order.csv$t$, null,
     $t${"Order ID":"31829027","User Name":"Jelina Augustave","Organization":"North Carolina State Education Assistance Authority","State":"NC","School":"N/A","Payment Approval Date":"4/29/2026","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100286","Distribution Name":"ESA+ 25-26","Payment Amount":"$1,499.06","Fee":"$38.44","Total":"$1,537.50","Status":"Settled","Last Update":"5/2/2026","Transaction ID":"260501110341WJE"}$t$::jsonb),
    (v_nc, $t$32933743$t$, $t$260615153209L93$t$, $t$100318$t$,
     $t$Jelina Augustave$t$, $t$ESA+ 25-26$t$, 1537.50, 38.44, 1499.06,
     date '2026-06-11', date '2026-06-16', $t$settled$t$, null, $t$nc.virtual.order.csv$t$, null,
     $t${"Order ID":"32933743","User Name":"Jelina Augustave","Organization":"North Carolina State Education Assistance Authority","State":"NC","School":"N/A","Payment Approval Date":"6/11/2026","Est. Timeframe":"2-10 Business days","Invoice/Quote":"#100318","Distribution Name":"ESA+ 25-26","Payment Amount":"$1,499.06","Fee":"$38.44","Total":"$1,537.50","Status":"Settled","Last Update":"6/16/2026","Transaction ID":"260615153209L93"}$t$::jsonb),
    (v_nc, $t$33659201$t$, $t$260724130115PL0$t$, $t$100331$t$,
     $t$Jelina Augustave$t$, $t$ESA+ 26-27$t$, 1537.50, 38.44, 1499.06,
     date '2026-07-22', date '2026-07-25', $t$settled$t$, null, $t$nc.virtual.order.csv$t$, null,
     $t${"Order ID":"33659201","User Name":"Jelina Augustave","Organization":"North Carolina State Education Assistance Authority","State":"NC","School":"N/A","Payment Approval Date":"7/22/2026","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100331","Distribution Name":"ESA+ 26-27","Payment Amount":"$1,499.06","Fee":"$38.44","Total":"$1,537.50","Status":"Settled","Last Update":"7/25/2026","Transaction ID":"260724130115PL0"}$t$::jsonb),
    (v_nc, $t$34965983$t$, $t$260828133248T8K$t$, $t$100332$t$,
     $t$Jelina Augustave$t$, $t$ESA+ 26-27$t$, 1537.50, 38.44, 1499.06,
     date '2026-08-25', date '2026-08-29', $t$settled$t$, null, $t$nc.virtual.order.csv$t$, null,
     $t${"Order ID":"34965983","User Name":"Jelina Augustave","Organization":"North Carolina State Education Assistance Authority","State":"NC","School":"N/A","Payment Approval Date":"8/25/2026","Est. Timeframe":"2-10 Business days","Invoice/Quote":"100332","Distribution Name":"ESA+ 26-27","Payment Amount":"$1,499.06","Fee":"$38.44","Total":"$1,537.50","Status":"Settled","Last Update":"8/29/2026","Transaction ID":"260828133248T8K"}$t$::jsonb)
  on conflict (funder_account_id, external_order_id) do nothing;


  -- ClassWallet AR - The Academy Virtual -- 1 order, net $1,537.50

  insert into public.funder_disbursements (
    funder_account_id, external_order_id, external_transaction_id, external_invoice_ref,
    payer_account_name, award_period, gross_amount, fee_amount, net_amount,
    approved_on, settled_on, status, declared_school, source_file, notes, raw
  ) values
    (v_arv, $t$35309739$t$, $t$2609071103278SU$t$, null,
     $t$Areli Romero$t$, $t$26-27 AR EFA$t$, 1537.50, 0.00, 1537.50,
     date '2026-09-04', date '2026-09-08', $t$settled$t$, $t$Friendship Lab School for Dyslexia$t$, $t$ar.virtual.order.csv$t$, null,
     $t${"Order ID":"35309739","User Name":"Areli Romero","Organization":"Arkansas Education Freedom Account","State":"AR","School":"Friendship Lab School for Dyslexia","Payment Approval Date":"9/4/2026","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"26-27 AR EFA","Payment Amount":"$1,537.50","Fee":"$0","Total":"$1,537.50","Status":"Settled","Last Update":"9/8/2026","Transaction ID":"2609071103278SU"}$t$::jsonb)
  on conflict (funder_account_id, external_order_id) do nothing;


  -- ClassWallet AR - The Academy HS -- 1 order, net $865.73

  insert into public.funder_disbursements (
    funder_account_id, external_order_id, external_transaction_id, external_invoice_ref,
    payer_account_name, award_period, gross_amount, fee_amount, net_amount,
    approved_on, settled_on, status, declared_school, source_file, notes, raw
  ) values
    (v_arh, $t$35013845$t$, $t$260904130714YGM$t$, null,
     $t$Izabella Mccallum$t$, $t$26-27 AR EFA$t$, 865.73, 0.00, 865.73,
     date '2026-09-02', date '2026-09-05', $t$settled$t$, $t$Homeschool$t$, $t$ar.hs.order.csv$t$, null,
     $t${"Order ID":"35013845","User Name":"Izabella Mccallum","Organization":"Arkansas Education Freedom Account","State":"AR","School":"Homeschool","Payment Approval Date":"9/2/2026","Est. Timeframe":"2-10 Business days","Invoice/Quote":"N/A","Distribution Name":"26-27 AR EFA","Payment Amount":"$865.73","Fee":"$0","Total":"$865.73","Status":"Settled","Last Update":"9/5/2026","Transaction ID":"260904130714YGM"}$t$::jsonb)
  on conflict (funder_account_id, external_order_id) do nothing;

end $$;

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification 1 - the money, per account.
--
-- Expect exactly this:
--
--   classwallet | az_esa      | The Academy Virtual | 28 | 6 |  49885.74 | 1028.75 |  50914.49 | 2.021
--   classwallet | nc_esa_plus | The Academy Virtual | 10 | 1 |  14649.36 |  375.64 |  15025.00 | 2.500
--   classwallet | ar_efa      | The Academy Virtual |  1 | 1 |   1537.50 |    0.00 |   1537.50 | 0.000
--   classwallet | ar_efa      | The Academy HS      |  1 | 1 |    865.73 |    0.00 |    865.73 | 0.000
--
-- unmatched_orders must equal orders on every line. Nothing is matched yet.
-- ---------------------------------------------------------------------------

select platform, program_code, school, orders, payers,
       net_received, platform_fees, gross_debited, fee_pct,
       first_settled, last_settled, unmatched_orders, unmatched_net
from public.funder_disbursement_summary
order by net_received desc;

-- ---------------------------------------------------------------------------
-- Verification 2 - the nine payer names, and who they MIGHT be.
--
-- THIS QUERY MATCHES NOTHING. It proposes. Every candidate it offers must be
-- confirmed by a person before 311 writes a student_id, because the portal
-- column is "User Name" - the ACCOUNT HOLDER - and that may be the parent, the
-- child, or a grandparent. Rows with no candidate are not errors; they are
-- families who are not in the JAG roster under that name at all.
--
-- Read the candidate_students column as a question, never as an answer.
-- ---------------------------------------------------------------------------

with payers as (
  select
    fa.account_label,
    d.payer_account_name              as portal_name,
    count(*)                          as orders,
    sum(d.net_amount)::numeric(12,2)  as net_received,
    min(d.settled_on)                 as first_settled,
    max(d.settled_on)                 as last_settled
  from public.funder_disbursements d
  join public.funder_accounts fa on fa.id = d.funder_account_id
  where d.match_status = 'unmatched'
  group by fa.account_label, d.payer_account_name
)
select
  p.account_label,
  p.portal_name,
  p.orders,
  p.net_received,
  p.first_settled,
  p.last_settled,
  (
    select string_agg(
             st.first_name || ' ' || st.last_name || ' [' || sc.name || ']',
             ' | ' order by st.last_name, st.first_name)
    from public.students st
    join public.schools sc on sc.id = st.school_id
    where lower(st.last_name) = lower(split_part(p.portal_name, ' ', 2))
       or lower(st.first_name) = lower(split_part(p.portal_name, ' ', 1))
  ) as candidate_students
from payers p
order by p.net_received desc;

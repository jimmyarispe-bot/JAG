-- 302_import_admissions_2026_09_07.sql
--
-- 13 rows from Student_Admissions_Spreadsheet_1788805509.xlsx (Monday.com
-- admissions board export, submissions 2 - 7 September 2026) -> 12 leads.
--
-- Explicit column mapping, not the import wizard. The matcher at
-- /dashboard/admissions/import still scores "Parent First Name" as a 0.75
-- candidate for a child's first_name and has no usedSources guard -- the fault
-- that put a parent's name into seven children's own name fields on 21 August.
-- It has not shipped a fix.
--
-- THE DUPLICATE GUARD IS ON (guardian_email, date_of_birth), AND THAT MATTERS
-- HERE. Script 239 guarded on guardian_email ALONE, which was right for the
-- fault it was fixing but is wrong for this sheet: Timarr Lamb Sr has TWO
-- children in it, Timarr Jr and Timarion. An email-only guard would have
-- silently imported the first and dropped the second, and the count would have
-- looked like a clean run. Email cannot be split wrong; date of birth
-- distinguishes siblings. Together they are the right key.
--
-- 13 ROWS, 12 LEADS. Penelope Kwiatkowski submitted twice -- 3 September as
-- "1st Request Interest Meeting/Call", then 5 September as "Inquiry Received".
-- Same child, same DOB, same parent. She lands as ONE lead carrying the FURTHER
-- stage, information_sent, dated from the earlier submission. Dropping her back
-- to new_inquiry because a later form said so would discard the fact that
-- information has already been sent to her mother, and could re-trigger a
-- first-contact email to a family already in conversation.
--
-- NO EMAIL IS SENT BY THIS SCRIPT. It writes rows. The communications engine
-- runs on its own schedule and the parent reminder templates are currently
-- disabled.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the verification.

begin;

do $$
declare
  v_fl uuid; v_ga uuid; v_hs uuid; v_vi uuid;
begin
  select id into v_fl from public.schools where name = 'The Academy FL';
  select id into v_ga from public.schools where name = 'The Academy GA';
  select id into v_hs from public.schools where name = 'The Academy HS';
  select id into v_vi from public.schools where name = 'The Academy Virtual';

  if v_fl is null or v_ga is null or v_hs is null or v_vi is null then
    raise exception 'School lookup failed (FL=%, GA=%, HS=%, Virtual=%). Run: select id, name from public.schools;',
      v_fl, v_ga, v_hs, v_vi;
  end if;

  -- 1. Charles Rosainz -> FL, 2nd_grade, new_inquiry
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_fl, $t$Charles$t$, $t$Rosainz$t$, date '2019-07-16', '2nd_grade', 'academy_fl_campus',
         $t$Google search$t$, $t$Elizabeth$t$, $t$Rosainz$t$, $t$evanhorn143@yahoo.com$t$,
         $t$+19788082703$t$, 'new_inquiry', date '2026-09-02',
         $t$Imported from Monday.com admissions board 2026-09-07.
Campus: Port St. Lucie. (admissions_leads has no campus column.)
Preferred start date: 2027-08-02.
Address: 4953 SW Lake Grove Cir, Palm City, FL 34990, USA
GREATNESS: He is friendly, outgoing, and kind.
Challenges: He is struggling with reading and testing
Additional: He has been diagnosed with dylexia and ADHD
Guardian email (evanhorn143@yahoo.com) does not match the family surname. Not necessarily wrong, but confirm it is the right address before sending.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$evanhorn143@yahoo.com$t$ and date_of_birth = date '2019-07-16'
  );

  -- 2. Isabella Bullock -> GA, 2nd_grade, new_inquiry
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_ga, $t$Isabella$t$, $t$Bullock$t$, date '2019-04-04', '2nd_grade', 'academy_ga_campus',
         $t$Google search$t$, $t$Anya$t$, $t$Washington Bullock$t$, $t$anyawashington@gmail.com$t$,
         $t$+16789085815$t$, 'new_inquiry', date '2026-09-02',
         $t$Imported from Monday.com admissions board 2026-09-07.
Preferred start date: 2027-01-02.
Address: 4817 Clay Brooke Drive Southeast, Smyrna, GA, USA
GREATNESS: Bella is an amazing 7 year old who is on the spectrum! She currently attends It’s A Sensory World Academy in Farmers Branch Texas and has been there for 3 years. She was non verbal until last year and her language is budding daily! She loves crafts, dancing, and playing with friends! We are relocating back to my hometown of Smyrna in January 2027 and looking at educational options that can help continuing her growth and language development!
Challenges: Handwriting and engaging with others in appropriate ways
Additional: She has been in speech and OT since age 3. She has great cognitive skills and is a fast learner! Her new found voice is unlocking a whole new world to her and us❤️
Family is relocating from Farmers Branch, Texas to Smyrna, GA in January 2027; start date reflects the move, not a deferral.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$anyawashington@gmail.com$t$ and date_of_birth = date '2019-04-04'
  );

  -- 3. Ne’Riley Francois -> FL, 1st_grade, new_inquiry
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_fl, $t$Ne’Riley$t$, $t$Francois$t$, date '2019-10-17', '1st_grade', 'academy_fl_campus',
         $t$Friend$t$, $t$Tedricka$t$, $t$Francois$t$, $t$tedricka.burse@yahoo.com$t$,
         $t$+17725778211$t$, 'new_inquiry', date '2026-09-02',
         $t$Imported from Monday.com admissions board 2026-09-07.
Campus: Port St. Lucie. (admissions_leads has no campus column.)
Preferred start date: 2026-09-08.
Address: Fort Pierce, FL, USA
GREATNESS: outside-the-box" thinker who approach problems with original, imaginative solutions.
Challenges: significant difficulty with several foundational academic and classroom skills. She has difficulty maintaining attention, following directions, completing independent work, and demonstrating skills independently. I am also observing challenges with phonemic awareness, early reading and writing, letter and number recognition, and transferring information from the board to her journal. She often becomes frustrated with academic tasks and may choose preferred activities, such as drawing or cutting, instead of completing assigned work. Although she may sometimes demonstrate understanding verbally, she has difficulty showing that understanding independently through writing and other academic activities. She currently requires a significant amount of individual support to complete first-grade work.
Additional: difficulty following adult directions and responding safely when redirected. She cooperates with one on one Individualized level of support.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$tedricka.burse@yahoo.com$t$ and date_of_birth = date '2019-10-17'
  );

  -- 4. Riley Zweck -> HS, 9th_grade, information_sent
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_hs, $t$Riley$t$, $t$Zweck$t$, date '2012-05-07', '9th_grade', 'academy_hs',
         $t$Google search$t$, $t$Teslyn$t$, $t$Campbell$t$, $t$tbzweck13@gmail.com$t$,
         $t$+13179000677$t$, 'information_sent', date '2026-09-03',
         $t$Imported from Monday.com admissions board 2026-09-07.
Preferred start date: 2026-09-07.
Address: 221 N Chicago Ave, Brazil, IN 47834, USA
GREATNESS: She is creative and outgoing.
Challenges: Math, English
Board notes: 9/4/26 1st sent
Guardian surname (Campbell) differs from the student's (Zweck).$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$tbzweck13@gmail.com$t$ and date_of_birth = date '2012-05-07'
  );

  -- 5. Penelope Kwiatkowski -> Virtual, 8th_grade, information_sent
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_vi, $t$Penelope$t$, $t$Kwiatkowski$t$, date '2012-05-09', '8th_grade', 'academy_virtual',
         $t$Instagram post$t$, $t$Jennifer$t$, $t$Arzola$t$, $t$jenniferlarzola@gmail.com$t$,
         $t$+12196170933$t$, 'information_sent', date '2026-09-03',
         $t$Imported from Monday.com admissions board 2026-09-07.
Submitted the interest form twice: 2026-09-03 (1st Request Interest Meeting/Call) and again 2026-09-05 (Inquiry Received). Merged to one lead at the further stage.
Preferred start date: 2026-09-14.
Address: 808 Hatch Lake Pkwy, Valparaiso, IN 46385, USA
GREATNESS: She is so good at recognizing patterns and remembering small details.
Challenges: Pen struggles with organization and in person interactions
Board notes: 9/4/26 1st sent$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$jenniferlarzola@gmail.com$t$ and date_of_birth = date '2012-05-09'
  );

  -- 6. Timarr Lamb Jr -> GA, 6th_grade, new_inquiry
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_ga, $t$Timarr$t$, $t$Lamb Jr$t$, date '2013-05-02', '6th_grade', 'academy_ga_campus',
         $t$Google search$t$, $t$Timarr$t$, $t$Lamb Sr$t$, $t$lambtimarr@yahoo.com$t$,
         $t$+14044908742$t$, 'new_inquiry', date '2026-09-04',
         $t$Imported from Monday.com admissions board 2026-09-07.
Preferred start date: 2026-09-10.
Address: 2225 Interstate North Parkway West, Atlanta, GA, USA
GREATNESS: Math
Challenges: Socializing, Reading, and Spelling
Additional: I am just learning that my son is on the spectrum of autism so I am waiting for paperwork from his mom. But the functioning and VERY antisocial.
GRADE CHECK: 13 years old in 6th grade is roughly a year older than typical (11-12). Confirm placement with the family.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$lambtimarr@yahoo.com$t$ and date_of_birth = date '2013-05-02'
  );

  -- 7. Timarion Lamb -> GA, 3rd_grade, new_inquiry
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_ga, $t$Timarion$t$, $t$Lamb$t$, date '2016-12-16', '3rd_grade', 'academy_ga_campus',
         $t$Google search$t$, $t$Timarr$t$, $t$Lamb Sr$t$, $t$lambtimarr@yahoo.com$t$,
         $t$+14044908742$t$, 'new_inquiry', date '2026-09-04',
         $t$Imported from Monday.com admissions board 2026-09-07.
Preferred start date: 2026-09-10.
Address: 2225 Interstate North Parkway West, Atlanta, GA, USA
GREATNESS: Math, likes to read, VERY Social
Challenges: Reading and spelling
Additional: My son is Very Hyper Active and even though he is not diagnosed with ADHD you can tell by his  hyperness it’s there. He sometimes has a hard time, focusing on one task and completing it because he gets very distracted easily.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$lambtimarr@yahoo.com$t$ and date_of_birth = date '2016-12-16'
  );

  -- 8. Christian Pass Jr -> Virtual, 11th_grade, new_inquiry
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_vi, $t$Christian$t$, $t$Pass Jr$t$, date '2008-11-03', '11th_grade', 'academy_virtual',
         $t$Google search$t$, $t$Vanessa$t$, $t$Pass$t$, $t$vdpass@gmail.com$t$,
         $t$+19252164655$t$, 'new_inquiry', date '2026-09-05',
         $t$Imported from Monday.com admissions board 2026-09-07.
Preferred start date: 2026-09-09.
Address: West Hollywood, CA, USA
GREATNESS: He is very bright and has a mind for business
Challenges: Academically
Additional: CJ is diagnosed with ADHD, Dyslexia, Dysgraphia, Working Memory. He has a hard time being a self starter
AGE DISCREPANCY: the sheet says 16 years old, but a birthdate of 2008-11-03 makes him 17 on the inquiry date (18 in November). DOB is stored as given; confirm which is right, because 11th grade at nearly 18 affects graduation planning.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$vdpass@gmail.com$t$ and date_of_birth = date '2008-11-03'
  );

  -- 9. Jasimine JOHNSON -> Virtual, 10th_grade, new_inquiry
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_vi, $t$Jasimine$t$, $t$Johnson$t$, date '2010-03-22', '10th_grade', 'academy_virtual',
         $t$Google search$t$, $t$Keona$t$, $t$Johnson$t$, $t$jasminej5985@gmail.com$t$,
         $t$+19855169840$t$, 'new_inquiry', date '2026-09-05',
         $t$TUTORING enquiry, not a full-school place. JAG has no separate tutoring program code; recorded as academy_virtual.
Imported from Monday.com admissions board 2026-09-07.
Preferred start date: 2026-09-08.
Address: Bogalusa, LA, USA
GREATNESS: She loves art drawing building and people
Challenges: Reading and remember things
CONTACT CHECK: the guardian is given as Keona Johnson but the guardian email is jasminej5985@gmail.com, which reads as the student's own address. Confirm before sending anything to it.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$jasminej5985@gmail.com$t$ and date_of_birth = date '2010-03-22'
  );

  -- 10. Albie Scarrott -> Virtual, 4th_grade, new_inquiry
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_vi, $t$Albie$t$, $t$Scarrott$t$, date '2016-10-14', '4th_grade', 'academy_virtual',
         $t$AI search$t$, $t$Naomi$t$, $t$Scarrott$t$, $t$naomi.scarrott@gmail.com$t$,
         $t$+48507546165$t$, 'new_inquiry', date '2026-09-06',
         $t$TUTORING enquiry, not a full-school place. JAG has no separate tutoring program code; recorded as academy_virtual.
Imported from Monday.com admissions board 2026-09-07.
Preferred start date: 2026-09-07.
Address: Scandinavian House, 02-972 Warszawa, Poland
GREATNESS: creativity and love of building. He is a very sociable child and the best part of his day every day is recess with his friends.
Challenges: reading due to dyslexia. Writiing due to dysgraphia. Math as there has been huge gaps in his learning. Self confidence
Additional: no
INTERNATIONAL: family is in Warsaw, Poland (+48). Six-hour time difference to ET affects any live session scheduling.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$naomi.scarrott@gmail.com$t$ and date_of_birth = date '2016-10-14'
  );

  -- 11. Sophia Lossa -> FL, 2nd_grade, new_inquiry
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_fl, $t$Sophia$t$, $t$Lossa$t$, date '2019-04-23', '2nd_grade', 'academy_fl_campus',
         $t$Google search$t$, $t$Maria$t$, $t$Lossa$t$, $t$marmad678@gmail.com$t$,
         $t$+17272511214$t$, 'new_inquiry', date '2026-09-06',
         $t$Imported from Monday.com admissions board 2026-09-07.
Campus: Port St. Lucie. (admissions_leads has no campus column.)
Preferred start date: 2027-08-09.
Address: Port St. Lucie, FL, USA
GREATNESS: Sophia is bright, witty and very funny. She loves school and spending time with other children.
Challenges: Sophia struggles with reading. Specifically, reading fluency and comprehension. She was recently diagnosed with dyslexia.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$marmad678@gmail.com$t$ and date_of_birth = date '2019-04-23'
  );

  -- 12. Audrey Bean-Mehlsen -> Virtual, 7th_grade, new_inquiry
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_vi, $t$Audrey$t$, $t$Bean-Mehlsen$t$, date '2012-08-29', '7th_grade', 'academy_virtual',
         $t$AI search, Other social media, Google search$t$, $t$Bryan$t$, $t$Bean$t$, $t$bcbm1972@gmail.com$t$,
         $t$+14087597895$t$, 'new_inquiry', date '2026-09-07',
         $t$Imported from Monday.com admissions board 2026-09-07.
Preferred start date: 2026-09-14.
Address: 1717 S Dorsey Ln, Tempe, AZ 85281, USA
GREATNESS: Humor, eagerness
Challenges: Getting behind she has dyslexia and ADHD. She has suffered enough from past school not being able to diagnose
GRADE CHECK: 14 years old in 7th grade is about two years older than typical (12-13). Consistent with the family's account of falling behind; confirm placement.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$bcbm1972@gmail.com$t$ and date_of_birth = date '2012-08-29'
  );

end $$;

commit;

-- ---------------------------------------------------------------------------
-- Verification. Expect 12 rows, each with the CHILD's own name in
-- first_name/last_name -- never a parent's. Two rows share
-- lambtimarr@yahoo.com; that is the Lamb siblings and is correct.
-- ---------------------------------------------------------------------------

select
  l.first_name, l.last_name, s.name as school, l.current_grade,
  l.date_of_birth, l.guardian_first_name, l.guardian_last_name,
  l.guardian_email, l.lead_stage, l.inquiry_date
from public.admissions_leads l
join public.schools s on s.id = l.school_id
where l.guardian_email in (
  'evanhorn143@yahoo.com','anyawashington@gmail.com','tedricka.burse@yahoo.com',
  'tbzweck13@gmail.com','jenniferlarzola@gmail.com','lambtimarr@yahoo.com',
  'vdpass@gmail.com','jasminej5985@gmail.com','naomi.scarrott@gmail.com',
  'marmad678@gmail.com','bcbm1972@gmail.com'
)
order by l.inquiry_date, l.last_name;

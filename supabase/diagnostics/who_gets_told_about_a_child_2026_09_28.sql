-- Every address the JAG will send a child's details to, and which are personal.
--
-- Two acceptance notifications have landed in jimmy.arispe@gmail.com: Jayden
-- Roy (GA, 25 Sep, sent from nina.gaddy) and Rashard Salinding (Virtual,
-- 28 Sep, sent from heather.brown). The campus contact differs between them,
-- so the Gmail is not a campus setting - it is its own recipient row, on more
-- than one campus.
--
-- Each of those emails carried the child's name, the campus, the parent's name
-- and email address, and a live link to the record, into a consumer mailbox
-- outside the network's control.
--
-- Recipients resolve from school_admissions_contacts where
-- receives_notifications is true, falling back to the school's own
-- admissions_contact_email when that table has nothing for the campus. BOTH
-- are listed here, because changing one and leaving the other fixes nothing.
--
-- READ ONLY.

select *
  from (
    select 'contacts table'                    as source,
           sc.name                             as school,
           c.name                              as contact_name,
           c.email                             as email,
           c.receives_notifications            as receives_notifications,
           c.is_booking_contact                as is_booking_contact,
           case
             when c.email is null then 'not set'
             when c.email ~* '@(gmail|yahoo|hotmail|outlook|aol|icloud|me|comcast|live|msn)\.'
               then 'PERSONAL MAILBOX'
             when c.email !~* '@(theacademyway\.org|theacademyga\.org|thejag\.org)$'
               then 'outside the network''s domains'
             else 'ok'
           end                                 as verdict
      from public.school_admissions_contacts c
      join public.schools sc on sc.id = c.school_id

    union all

    select 'schools fallback column',
           sc.name,
           sc.admissions_contact_name,
           sc.admissions_contact_email,
           null,
           null,
           case
             when sc.admissions_contact_email is null then 'not set'
             when sc.admissions_contact_email ~* '@(gmail|yahoo|hotmail|outlook|aol|icloud|me|comcast|live|msn)\.'
               then 'PERSONAL MAILBOX'
             when sc.admissions_contact_email !~* '@(theacademyway\.org|theacademyga\.org|thejag\.org)$'
               then 'outside the network''s domains'
             else 'ok'
           end
      from public.schools sc
  ) rows
 order by case when verdict = 'PERSONAL MAILBOX' then 0
                when verdict like 'outside%'      then 1
                when verdict = 'not set'          then 2
                else 3 end,
          school,
          source;

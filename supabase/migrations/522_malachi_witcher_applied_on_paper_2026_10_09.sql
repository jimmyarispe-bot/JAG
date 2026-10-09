-- 522_malachi_witcher_applied_on_paper_2026_10_09.sql
--
-- Malachi Witcher applied to The Academy Virtual before the JAG existed. His
-- mother signed a paper Admissions/Registration Application and sent two
-- report cards with it. Jimmy, 9 October 2026: "that's it. he applied before
-- the jag. here are his docs. include in his jag application".
--
-- WHAT WAS ALREADY THERE. The lead has existed since 25 August 2026 and
-- already carries Krystal Johnson-Witcher's name, email and telephone,
-- Malachi's date of birth and his grade. Somebody typed those in. What has
-- never existed is the application itself - admissions_applications held no
-- row for him at all, which is why nothing downstream of it could happen.
--
-- WHAT THIS DOES NOT DO, AND THAT IS DELIBERATE
--
-- HIS STAGE IS NOT TOUCHED. He stays at interest_meeting_held. Jimmy's
-- standing rule, 29 September: "a student does not move from one stage to
-- the next without the school leader moving him/her." A migration is not a
-- school leader.
--
-- HIS GATE IS NOT ANSWERED. invite_to_apply stays pending. The JAG will hold
-- an application for a child it believes was never invited, which is odd and
-- is the truth: he was never invited, because he applied before there was
-- anything to be invited to. Jimmy answers that gate in the JAG when he is
-- ready, and the oddity is visible until he does rather than papered over.
--
-- HE IS NOT ACCEPTED. application_status is 'in_progress'. Five of the eight
-- applications in the JAG read 'accepted'; this one does not, because nobody
-- has made that decision and the report cards below are a reason to have the
-- conversation first.
--
-- THE TWO PDFS ARE NOT RECORDED HERE. application_documents wants a
-- storage_path, and the files are not in Supabase Storage - they came to
-- Jimmy as email attachments. Writing rows that point at files which do not
-- exist would be recording something untrue about a child's record. Upload
-- them through the JAG and the rows follow.

begin;

-- ============================================================================
-- FILL THESE IN BEFORE RUNNING. The migration refuses to run otherwise.
-- ============================================================================
--
-- Jimmy confirmed the $100 fee was paid and said he would give the date.
-- Until it is here, this file raises and rolls back rather than guessing -
-- a payment date invented by a migration is worse than no payment date.
--
-- v_application_date: the date on the signed paper form. If the form is not
-- dated, use the date it reached you. The report card attached to it was
-- scanned 3 September 2026 at 09:48, so the application cannot predate that.

do $$
declare
  /*
   * 4 September 2026 - Jimmy, 9 October, asked when the $100 was paid.
   *
   * The same date is used for the application itself. The report card sent
   * with it was scanned on 3 September at 09:48, so the application cannot
   * be older than that, and the paper form carries no date of its own. If
   * the form turns out to be dated differently, change v_application_date
   * and nothing else.
   *
   * Noon Eastern, because no time of day was recorded and midnight would
   * read as a precision nobody has.
   */
  v_application_date date        := date '2026-09-04';
  v_fee_paid_at      timestamptz := timestamptz '2026-09-04 12:00-04';

  /*
   * SQUARE, AND WHERE TO GO AND FIND IT.
   *
   * Jimmy, 9 October: Square. The charge is in Square and not in the JAG -
   * payments is empty, family_payment_methods is empty, no money has ever
   * moved through this platform - so this reference points at the system
   * that actually holds the record rather than pretending the JAG does.
   *
   * If the Square transaction id is to hand, replace this string with it.
   * A payer name and a date will find it; an id would find it faster.
   */
  v_fee_reference    text        := 'Square, 4 September 2026 - Krystal Johnson-Witcher. Charge is in Square, not in the JAG.';

  v_lead_id        uuid := 'cd88d9a6-5ad0-44ba-81a4-b29d0fca8091';  -- Malachi Witcher
  v_school_year_id uuid := '43d362b6-bdfb-4b94-a4f3-5206a0682d44';  -- Virtual 2026-2027 Year-Round
  v_existing       uuid;
begin
  if v_application_date is null or v_fee_paid_at is null or v_fee_reference is null then
    raise exception
      'Fill in v_application_date, v_fee_paid_at and v_fee_reference at the top of migration 522 before running it.';
  end if;

  /* Belt and braces. The lead was found by last name and the uuid pasted in;
     this proves the uuid still points at the child it pointed at. */
  perform 1 from public.admissions_leads
   where id = v_lead_id and lower(last_name) = 'witcher';
  if not found then
    raise exception 'Lead % is not Malachi Witcher. Stopping.', v_lead_id;
  end if;

  /* Idempotent. Running this twice must not give one child two applications. */
  select id into v_existing
    from public.admissions_applications
   where lead_id = v_lead_id;
  if v_existing is not null then
    raise exception 'Malachi Witcher already has application %. Nothing written.', v_existing;
  end if;

  insert into public.admissions_applications (
    lead_id,
    school_year_id,
    application_date,
    application_status,
    submitted_at,
    previous_school,
    student_summary,
    learning_needs_summary,
    guardian_notes,
    application_fee_cents,
    application_fee_status,
    application_fee_paid_at,
    application_fee_reference
  )
  values (
    v_lead_id,
    v_school_year_id,
    v_application_date,
    /* Not 'accepted'. Nobody has decided. */
    'in_progress',
    v_application_date,
    'Tallassee Elementary School, Tallassee City Schools, Tallassee, AL',

    /*
     * HER WORDS, NOT A SUMMARY OF THEM. Jimmy, 4 October: "pls don't
     * paraphrase. i cant follow this if the exact language isn't in every
     * part of this build." Each answer is stored under the question that
     * was actually asked, so nobody reading this later has to guess which
     * box it came out of.
     */
    'What is your child GREAT at? — "Science. He is very matter of fact so he likes that science can be proven."',

    'What frustrates your child most about his/her current school? — "They do not have a good system to really develop learners that may process information differently."'
      || E'\n\n'
      || 'What would you like for us to know about your child? — "He can be very easily distracted. Working with him on focus"'
      || E'\n\n'
      || 'FROM THE REPORT CARDS SENT WITH THE APPLICATION (Tallassee Elementary School). '
      || 'Grade 1, 2024-2025: English Language Arts D (68), Mathematics C (71), Science A (90), Social Studies B (91), Conduct A (97), PE A (100). Promoted. '
      || '9 absences (4 excused, 6 unexcused). '
      || 'Grade 2, 2025-2026: English Language Arts D (65) including an F (59) in Q3, Mathematics D (67), Science C (77), Social Studies C (77), Conduct A (91), PE A (100). Promoted. '
      || '14 absences (9 excused, 5 unexcused). '
      || 'Two consecutive years of D in English Language Arts, falling, at a school for children with Dyslexia and ADHD. '
      || 'The programme his mother selected is the 3rd-8th grade Full-School Program ONLY; she did not tick Tutoring: Wilson Structured Literacy. '
      || 'Recorded here because it is an admissions conversation, and because a thing like this disappears the moment it becomes a database row.',

    'Parent/Guardian who receives tuition invoices: Krystal Johnson-Witcher, krysjohnson90@gmail.com, (334) 354-0446. '
      || 'Mailing address: 263 Weldons Drive, Tallassee, AL 36078, United States. '
      || 'Requested start date at The Academy Virtual: 15 September 2026. '
      || 'Programme: 3rd - 8th grade Full-School Program. '
      || 'State, district or other government scholarship offsetting tuition: NO. '
      || 'Signed by the parent/guardian on the paper form. '
      || 'Sent with the application: report cards for 2024-2025 and 2025-2026 from Tallassee Elementary School '
      || '(sharp_tcschools.com_20260903_094841.pdf). No IEP, psychological report or writing sample was provided.',

    10000,
    'paid',
    v_fee_paid_at,
    v_fee_reference
  );

  /*
   * ONE FIELD ON THE LEAD, FROM THE SIGNED FORM.
   *
   * applying_for_grade was empty. The form says "My child is in the - 3rd
   * grade" and asks to start 15 September 2026, so third grade is what he is
   * applying for. current_grade already reads 3rd_grade and is left alone.
   *
   * Nothing else on the lead is touched. The guardian's name, email, telephone
   * and his date of birth are already correct and already match the paper.
   */
  update public.admissions_leads
     set applying_for_grade = '3rd_grade',
         updated_at = now()
   where id = v_lead_id
     and (applying_for_grade is null or btrim(applying_for_grade) = '');

end $$;

commit;

-- ============================================================================
-- AFTERWARDS
-- ============================================================================
--
-- THE TWO DOCUMENTS. Upload through the JAG against this application:
--
--   TheAcademyWayAdmissionsRegistrationApplication_5.pdf   the signed form
--   sharp_tcschools.com_20260903_094841.pdf                both report cards
--
-- document_type for the first is the application itself; the second is a
-- report card. Once they are in Storage the application_documents rows can
-- be written against their real storage_paths.
--
-- THE NAME FIELDS ON THAT FORM ARE REVERSED. The sub-labels read "Last" then
-- "First" and the boxes contain "Malachi" then "Witcher", and "Krystal" then
-- "Johnson-Witcher". Read literally the child is called Witcher Malachi.
-- Krystal filled it the way anyone would, left to right. Whoever typed the
-- lead in August used common sense and got it right; the next one might not.
-- The form wants fixing before it collects another name.
--
-- THE DECISION STILL TO MAKE. invite_to_apply is pending and he has sat at
-- interest_meeting_held since 25 August - six weeks, with no letter of any
-- kind ever sent to his family. Answering that gate is what unblocks him.

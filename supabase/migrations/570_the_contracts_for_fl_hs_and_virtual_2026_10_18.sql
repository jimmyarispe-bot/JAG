-- ============================================================================
-- 570  THE CONTRACTS FOR FL, HS AND VIRTUAL
--      18 October 2026
-- ============================================================================
--
-- GENERATED from src/lib/admissions/contract/fl-2026-09-06.ts,
-- hs-2026-09-06.ts and virtual-2026-09-06.ts (gen570.ts), which are the
-- source of record - as 447 was for GA. To change wording, change the module
-- and add a NEW migration. Contract language that lives only in a migration
-- is language nobody reviews a second time.
--
-- Jimmy, 18 October: "let's work on the contract, scholarships, schedule of
-- tuition payments, and payments", and on loading the 6 September revisions,
-- "with all of this too". Five blocks per campus, the same template keys as
-- GA, each initialled once; the Schedule of Tuition Payments renders on the
-- face. Elections (FL Tuition Lock, FL Tuition Insurance) are left out, as GA
-- left out insurance on 28 September: a signed block cannot record a choice.
--
-- DEPENDS ON 448 (contracting_legal_name, signatory_line). Run 448 and 449
-- first.
--
-- The old one-sentence placeholders at these three campuses were all
-- deactivated by 430 and stay that way. Nothing is deleted.
-- ============================================================================

begin;

-- The Academy FL
insert into public.enrollment_packet_templates
  (school_id, template_key, title, body_html, requires_signature, state_code, sort_order, is_active)
select sc.id, b.template_key, b.title, b.body_html, b.requires_signature, 'FL', b.sort_order, true
  from (values
    ($c$contract_tuition_and_payment$c$, $c$Enrollment and Tuition Contract — your figures and how you pay$c$, $c$<section>
  <h2>Enrollment and Tuition Contract</h2>
  <p>In consideration of, and subject to, the acceptance of this Enrollment and Tuition
  Contract by {{school_legal_name}} (hereinafter, the &ldquo;School&rdquo;), each of the
  undersigned parent(s) or legal guardian(s) (collectively, the &ldquo;Responsible
  Parties&rdquo;), jointly and severally agrees to pay the full tuition specified below for
  {{student_name}} (hereinafter, the &ldquo;Student&rdquo;). This Enrollment and Tuition
  Contract is a binding contract upon the Responsible Parties when signed and submitted to
  the School but is subject to final acceptance by the School. The language, terms, and
  conditions of this Enrollment and Tuition Contract are non-negotiable.</p>

  <p>Your initials or signature are required below as acknowledgement and agreement. Any
  comments, statement or anything other than your initials or signature acknowledging your
  acceptance and agreement with the statements and information contained within are not valid,
  will be disregarded, and will not have any bearing or imply any negotiation or agreement on
  behalf of the School. The language, terms, and conditions of this Enrollment and Tuition
  Contract are non-negotiable and by submitting your initials and signature below, you
  understand and agree to this.</p>

  <table class="contract-facts">
    <tbody>
      <tr><th>Student</th><td>{{student_name}}</td></tr>
      <tr><th>Grade level for this contract year</th><td>{{student_grade}}</td></tr>
      <tr><th>School year</th><td>{{school_year}}</td></tr>
      <tr><th>School</th><td>{{school_name}}</td></tr>
      <tr><th>Parent/Legal Guardian 1</th><td>{{guardian_1_name}}</td></tr>
    </tbody>
  </table>
  <p>Parent/Legal Guardian 1 is also the person who all tuition, contracts, and other
  business information will be communicated with.</p>
</section>

<section>
  <h3>Emergency Contact and Medical Information</h3>
  <p>Make sure to complete this form as quickly as possible. {{student_name}} CANNOT attend
  our school and enrollment is not finalized until the Emergency Contact and Medical
  Information Form is completed and submitted.</p>
</section>

<section>
  <h3>Schedule of Tuition Payments</h3>
  <p>I understand and agree that {{student_name}}&rsquo;s Tuition amount will be according to
  the figures set out below, which form part of this Enrollment and Tuition Contract.</p>

  {{tuition_derivation}}

  {{schedule_of_payments}}
</section>

<section>
  <h3>Tuition payments and conditions</h3>
  <p>Timely payment of tuition is a condition of continued enrollment. The tuition charges do
  not include field trip fees, before/after school programs, camps or other ancillary
  services. All other services and related charges will be billed to Responsible Party who
  agrees to pay all such charges within 30 days of notice. Payment of charges is a condition
  of continued enrollment.</p>

  <p>I understand I will be sent an electronic invoice immediately after submission of this
  document to begin making tuition payments according to the Schedule of Tuition Payments set
  out above.</p>

  <p>Additionally, the following conditions apply:</p>

  <ol>
    <li>I understand I will be sent an electronic invoice immediately after submission of
    this document to make my initial tuition payment. Each additional electronic monthly
    invoice thereafter will be sent on the <strong>20th</strong> of each month to be due on
    the <strong>25th</strong> of each month.</li>

    <li>I understand there are convenience fees added to invoices when paying by credit or
    debit card payment. ACH payments can be made as well with minimal convenience fees
    added.</li>

    <li>I understand that if I am choosing to make monthly payments, and if I cease to make
    payments for any reason, I am still liable for the full annual tuition amount of
    {{annual_tuition}}.</li>

    <li>Tuition payments received are first applied against the oldest outstanding
    amounts.</li>

    <li><strong>LATE PAYMENTS.</strong> Tuition is due on or before the <strong>25th day of
    each month</strong>, in the amounts and on the dates set out in my Schedule of Tuition
    Payments above. If the full amount due has not been received by the <strong>1st day of
    the following month</strong>, a late fee of <strong>$25 per day</strong> will be assessed
    automatically, for a maximum of <strong>five days ($125)</strong>.</li>

    <li><strong>SUSPENSION OF ATTENDANCE.</strong> If my account has not been brought current
    &mdash; all tuition due plus any late fees assessed &mdash; by the end of that five-day
    period, {{student_name}}&rsquo;s attendance will be <strong>suspended</strong> until
    payment has been received. A suspension does not reduce or relieve any part of my tuition
    obligation.</li>
  </ol>
</section>

<section>
  <h3>Parent-Payments</h3>
  <p>I understand that any portion of tuition not covered by a scholarship or voucher is my
  Parent-Payment, due in the amounts and on the dates set out in my Schedule of Tuition
  Payments. The <strong>LATE PAYMENTS</strong> and <strong>SUSPENSION OF ATTENDANCE</strong>
  terms above apply to my Parent-Payments in full.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with everything in this section, including the figures set out above.</p>$c$, true, 1),
    ($c$contract_scholarships$c$, $c$Scholarships$c$, $c$<section>
  <h3>Scholarships (if applicable)</h3>
  <p>I understand the TOTAL published annual tuition amount is {{annual_tuition}}, as set out
  in my Schedule of Tuition Payments.</p>

  <p>I understand in order to receive any scholarship of any kind, I must upload and provide
  to the School, documentation from the entity providing these funds. This documentation must
  show the amount of funds being provided and any student reference number/ID.</p>

  <p>I understand any funds received from a scholarship will be deducted from
  {{student_name}}&rsquo;s TOTAL annual tuition amount as set out in the Schedule of Tuition
  Payments.</p>

  <p>I understand if {{student_name}} is using or being provided a scholarship of any kind
  (including funds provided by the School) in the calculation and/or reduction of my tuition
  and/or monthly payment amounts, <strong>I am responsible for the entire remaining portion
  of the TOTAL and FULL published annual tuition amount of {{annual_tuition}} should I
  remove/withdraw {{student_name}} prior to the expiration date of this contract.</strong></p>

  <p>I understand the School will not release any academic records or complete/provide any
  student information requested by another school until the TOTAL annual tuition amount has
  been satisfied.</p>
</section>

<section>
  <h3>Florida Scholarships/Vouchers</h3>
  <p>If you have or are scheduled to receive a Florida Scholarship/Voucher from the state,
  please take a screen shot or upload the documentation showing the amount(s) of your
  scholarship(s). This documentation should clearly indicate your AWARD ID. We will deduct
  this amount from the overall annual tuition amount stated above and spread payments out
  equally over the remaining months of the school year.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with this section, including my responsibility for the full published tuition
if {{student_name}} is withdrawn before this contract expires.</p>$c$, true, 2),
    ($c$contract_program_and_operations$c$, $c$Program and operations$c$, $c$<section>
  <h3>Educational program</h3>
  <p>The School reserves the right, and the Responsible Parties agree that the School shall
  have the right, in the School&rsquo;s sole discretion, to determine the School&rsquo;s course
  offerings, activities, schedule, organizations, school publications and personnel, together
  with any changes thereto, and to determine which teachers and classes are appropriate for
  the Student and to determine how and by what methods educational instruction will be
  provided for the Student, and possibly without notice to Responsible Parties. In addition,
  the School reserves the right, and the Responsible Parties agree that the School, in the
  School&rsquo;s sole discretion shall have the right at any time to adopt or modify the
  School&rsquo;s educational program, policies, practices, procedures, curriculum and
  schedules, and rules and regulations related thereto.</p>
</section>

<section>
  <h3>Parent Handbook</h3>
  <p>I understand I will be sent a Parent Handbook by School administration within 30 days of
  this signed contract. The Responsible Party agrees to comply with the Parent Handbook along
  with an understanding that information may be added or changed during the school year as the
  school staff feels necessary. Should this occur, Responsible Parties will be notified of the
  specific changes immediately when they are made.</p>
</section>

<section>
  <h3>Laptop</h3>
  <p>I understand and agree to furnish {{student_name}} with a laptop (not iPad or tablet) to
  be used at school each day. Additionally, I agree to install any necessary child monitoring
  and safety application on this laptop to ensure {{student_name}} is only able to access
  appropriate age-related information. I agree it is not the School&rsquo;s responsibility and
  do not/will not hold the School liable for any situation where the student is using this
  device for non-school related purposes. Should this device be damaged or lost while at
  school, I will replace it or have it repaired as quickly as possible and not to exceed 2
  weeks. I understand and accept it is not the School&rsquo;s responsibility under any
  circumstances to repair or replace this device.</p>
</section>

<section>
  <h3>Additional services</h3>
  <p>The School will work with Responsible Parties and/or parents to ensure that their
  Student&rsquo;s educational needs are being met. In the event the School determines the
  Student needs additional services not specifically stated in other supporting Enrollment
  documents, these fees will not be covered under this Enrollment and Tuition Contract.</p>

  <p>A separate agreement between the School and the Responsible Parties will be agreed upon
  for these fees and in order for the Student to remain enrolled in a successful manner.
  Additionally, if the school determines in its sole discretion, that it can no longer meet the
  educational needs of the Student and/or if the Student is not progressing adequately with or
  without additional services, the School may relieve the Responsible Parties of prorated
  financial obligations at the School&rsquo;s sole determination.</p>
</section>

<section>
  <h3>School operations</h3>
  <p>The School reserves the right, and the Responsible Parties agree that the School shall
  have the right, in the School&rsquo;s sole discretion, to create and make adjustments to the
  School&rsquo;s academic year calendar and to temporarily close or otherwise regulate the
  School&rsquo;s operation to the extent the School determines that such course of action is
  necessitated by acts of God, pandemic, strikes, lockouts, shortages, restrictions, rules or
  regulations imposed by any governmental authority, civil, riot, fire, floods, and any other
  cause not reasonably within the control of the School.</p>
</section>

<section>
  <h3>Off campus learning</h3>
  <p>At times, the School may deem it necessary and/or appropriate to take students off-campus
  to enhance their learning. This may occur within walking distance to nearby areas, and/or in
  staff vehicles to offsite driveable locations. Academy staff will notify parents via email at
  least the day prior whenever students are scheduled to be taken to an offsite location in
  staff vehicles. Additionally, parents will be given the address where students will be taken,
  expected timeframe of attendance, and an emergency school cell phone #.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with this section.</p>$c$, true, 3),
    ($c$contract_conduct_and_consents$c$, $c$Conduct, consents and waivers$c$, $c$<section>
  <h3>Student conduct</h3>
  <p>The School reserves the right, and the Responsible Parties agree that the School shall
  have the right in the School&rsquo;s sole discretion, to suspend, dismiss or expel
  {{student_name}}, and to revoke or terminate this Enrollment and Tuition Contract for
  {{student_name}}, for violation of or failure to comply with socially and educationally
  acceptable behavior norms and standards as determined by the School in its sole discretion,
  to warrant such action, including, but not limited to, inappropriate, disrespectful or
  unsatisfactory conduct, behavior or performance by the Student and inappropriate,
  disrespectful or unsupportive conduct, behavior or performance by the Responsible
  Parties.</p>
</section>

<section>
  <h3>Photo, video and related consent</h3>
  <p>The Responsible Parties hereby authorize without limitation the School, its successors and
  assigns, and those acting with its permission and upon its authority, to photograph, videotape,
  or film the Student for advertising, marketing, publicity or any other lawful purpose for the
  benefit of or relating to the School. Neither the Student nor the Responsible Parties shall be
  entitled to receive any compensation for such use, and the Responsible Parties hereby release
  the School, its successors and assigns, and those acting with its permission and upon its
  authority, from any liability, responsibility, or claim that may arise by reason of any
  exercise of the authority granted above. The School agrees to never use any specific
  identifying student information for any reason at any time for any of the above causes.</p>
</section>

<section>
  <h3>Other considerations</h3>
  <p>The School, in its sole discretion, is entitled to accept or reject this Enrollment and
  Tuition Contract for any reason and at any time, including, but not limited to, the conduct of
  {{student_name}} or the conduct of the Responsible Parties. Acceptance of this Enrollment and
  Tuition Contract for {{student_name}} for a previous academic year does not obligate the
  School to send an Enrollment and Tuition Contract to the Responsible Parties for
  {{student_name}} for any subsequent academic year. The obligation to pay tuition for the full
  year is unconditional, notwithstanding the subsequent dismissal, expulsion, withdrawal, or
  absence for any reason of the Student.</p>

  <p>Responsible Parties agree that in the event {{student_name}} voluntarily withdraws from the
  School, or is suspended, dismissed or expelled from the School for any reason on or after the
  first day of school, the full year&rsquo;s tuition is due and payable by the Responsible
  Parties to the School as full compensatory liquidated damages under this Enrollment and Tuition
  Contract, and not as a penalty; and that it is impossible to more precisely estimate the damage
  to be suffered by the School in the event of such withdrawal, suspension, dismissal or
  expulsion.</p>

  <p>The Responsible Parties acknowledge and agree that the School has needs and expectations for
  such tuition and has planned for payments of such tuition irrespective of any operating budget
  surplus that the School may have for such school year, for among other uses, to pay budgeted and
  unbudgeted 1) operating costs and expenses, 2) costs and expenses of maintenance, repair,
  replacement, and/or installation or construction of improvements, fixtures, systems and
  equipment, 3) outstanding indebtedness owed by the School, and 4) increasing the School&rsquo;s
  endowment.</p>
</section>

<section>
  <h3>Waiver of liability</h3>
  <p>The Responsible Parties agree that the participation by the Student in any School-related
  activity shall be undertaken at the Student&rsquo;s and Responsible Parties&rsquo; own risk.
  The School and its administrators, faculty, trustees, employees, agents, volunteers and
  contractors (all of the foregoing, collectively, the &ldquo;School Parties&rdquo;), shall not
  be liable for any claims, demands, injuries, damages, actions or causes of action whatsoever
  to the Student or the Responsible Parties or the Students&rsquo; or the Responsible
  Parties&rsquo; property arising out of, or connected with, the Student attending or
  participating in any activities of the School.</p>

  <p>The Responsible Parties do hereby expressly forever release and discharge the School
  Parties from all such claims, demands, injuries, damages, actions, or causes of action, and
  from all acts of active or passive negligence, including, without limitation, negligent
  supervision, on the part of the School Parties, or the condition or defect, whether visible or
  latent, of any vehicle, equipment or other personal property or any real property, including
  but not limited to, any facilities or improvements located on such real property, in which the
  School has an ownership, leasehold, or other interest.</p>

  <p>This Waiver of Liability explicitly relates to any occurrence during the transportation of
  the registered student(s) to/from the School and releases all School Parties from all such
  claims, demands, injuries, damages, actions, or causes of action, and from all acts of active
  or passive negligence, including, without limitation, negligent supervision, on the part of
  the School Parties, or the condition or defect, whether visible or latent, of any vehicle,
  equipment or other personal property used for transporting students in which the School has an
  ownership, leasehold, or other interest.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with this section.</p>$c$, true, 4),
    ($c$contract_acknowledgement$c$, $c$Acknowledgement and signature$c$, $c$<section>
  <h3>Acknowledgement</h3>
  <p>This Enrollment and Tuition Contract shall be governed by and interpreted in accordance with
  the laws of the State of Florida. This Enrollment and Tuition Contract contains the entire
  agreements of the parties and supersedes all prior agreements, written or oral, between the
  parties. This Enrollment and Tuition Contract may not be amended except in a written document
  signed by all parties that expressly acknowledges such amendment(s).</p>

  <p>This agreement may be executed in any number of counterparts and by different parties in
  separate counterparts. Each counterpart, when so executed, shall be deemed to be an original and
  all of which together shall constitute one and the same agreement.</p>

  <p>I/We, the Responsible Parties, parent(s) or legal guardian(s) financially responsible for
  {{student_name}}, have read and understand this Enrollment and Tuition Contract, agree to the
  terms, and will abide by the terms as stated.</p>

  <p>I/we agree, and have read and understood all the above terms and conditions. I/we
  understand that the terms and conditions outlined above are in addition to the terms and
  conditions of the Enrollment and Tuition Contract.</p>

  <p>In the event this Enrollment and Tuition Contract shall be in default and placed with an
  attorney for collections, then the undersigned agree to pay all reasonable attorney fees and
  costs of collections incurred by the School. The undersigned agrees to remain fully bound
  hereunder until this agreement shall be fully paid. No modification shall be binding unless in
  writing. This Enrollment and Tuition Contract shall be deemed valid and binding once all parties
  have signed below, whether that signature be original or electronically submitted.</p>
</section>

<section>
  <h3>Signatures</h3>
  <table class="contract-facts">
    <tbody>
      <tr><th>Student</th><td>{{student_name}}</td></tr>
      <tr><th>School year</th><td>{{school_year}}</td></tr>
      <tr><th>Total published annual tuition</th><td>{{annual_tuition}}</td></tr>
      <tr><th>Your responsibility</th><td>{{remaining_due}}</td></tr>
      <tr><th>Parent/Guardian 1</th><td>{{guardian_1_name}}</td></tr>
      <tr><th>Parent/Guardian 2</th><td>{{guardian_2_name}}</td></tr>
    </tbody>
  </table>

  <p>By submitting my signature below, I am acknowledging my understanding and agreement with this
  Enrollment and Tuition Contract as outlined above.</p>

  <p><strong>Agreed to and accepted by</strong><br />
  {{school_signatory}}</p>

  <p class="contract-binding">AFTER SUBMISSION OF THIS DOCUMENT, THIS ENROLLMENT AND TUITION
  CONTRACT BECOMES A FULLY BINDING AND ENFORCEABLE CONTRACT.</p>
</section>$c$, true, 5)
  ) as b(template_key, title, body_html, requires_signature, sort_order)
  cross join public.schools sc
 where lower(trim(sc.name)) = 'the academy fl'
on conflict (school_id, template_key) do update
   set title              = excluded.title,
       body_html          = excluded.body_html,
       requires_signature = excluded.requires_signature,
       state_code         = excluded.state_code,
       sort_order         = excluded.sort_order,
       is_active          = true,
       updated_at         = now();

-- The Academy HS
insert into public.enrollment_packet_templates
  (school_id, template_key, title, body_html, requires_signature, state_code, sort_order, is_active)
select sc.id, b.template_key, b.title, b.body_html, b.requires_signature, 'GA', b.sort_order, true
  from (values
    ($c$contract_tuition_and_payment$c$, $c$HS Virtual Services Enrollment Contract — your figures and how you pay$c$, $c$<section>
  <h2>HS Virtual Services Enrollment Contract</h2>
  <p>In consideration of, and subject to, the acceptance of this HS Virtual Services Enrollment Contract by
  {{school_legal_name}} (hereinafter, the &ldquo;School&rdquo;), each of the undersigned
  parent(s) or legal guardian(s) (collectively, the &ldquo;Responsible Parties&rdquo;), jointly
  and severally agrees to pay the full monthly tuition for {{student_name}} (hereinafter, the
  &ldquo;Student&rdquo;). This HS Virtual Services Enrollment Contract is a binding contract upon the Responsible
  Parties when signed and submitted to the School but is subject to final acceptance by the
  School. The language, terms, and conditions of this HS Virtual Services Enrollment Contract are
  non-negotiable.</p>

  <table class="contract-facts">
    <tbody>
      <tr><th>Student</th><td>{{student_name}}</td></tr>
      <tr><th>Grade level for this contract year</th><td>{{student_grade}}</td></tr>
      <tr><th>School year</th><td>{{school_year}}</td></tr>
      <tr><th>School</th><td>{{school_name}}</td></tr>
      <tr><th>Parent/Guardian 1</th><td>{{guardian_1_name}}</td></tr>
    </tbody>
  </table>
</section>

<section>
  <h3>Contract term and notification</h3>
  <p>I understand and agree that this is a month to month contract. Responsible Parties can end
  this commitment at any time, however, there will be no proration or refund of any kind and
  regardless of when the School was notified. Additionally, should Responsible Parties be
  provided with a Schedule of Tuition Payments that take into account a State
  Scholarship/Voucher being used to subsidize tuition, this/these State Scholarship/Voucher
  Payments will be fully owed to the School for the amounts and dates as outlined in the
  Schedule of Tuition Payments.</p>

  <p>Responsible Parties agree to inform the School as early as possible by email of any planned
  change in enrollment as the School makes extraordinary efforts to group children together in
  the most effective manner possible at all times. Your child&rsquo;s withdrawal at an
  unscheduled time and other than the end of the school year may cause the School to make
  adjustments in other students&rsquo; schedules as well.</p>
</section>

<section>
  <h3>Schedule of Tuition Payments</h3>
  <p>I understand and agree that {{student_name}}&rsquo;s tuition will be according to the
  figures set out below, which form part of this HS Virtual Services Enrollment Contract.</p>

  {{tuition_derivation}}

  {{schedule_of_payments}}
</section>

<section>
  <h3>Tuition payments and conditions</h3>
  <p>Timely payment of tuition is a condition of continued enrollment.</p>

  <p>I understand I will be sent an electronic invoice immediately after submission of this
  document to make the initial tuition payment as set out in the Schedule of Tuition Payments
  above.</p>

  <p>The following conditions apply:</p>

  <ol>
    <li>I understand I will receive a Square invoice to accept and setup my recurring invoices.
    These payments will be initiated on the 21st of the month for ACH payments or on the 25th for
    credit/debit card payments.</li>

    <li>I understand there is a convenience fee of 3% added to my tuition if paying by credit or
    debit card payment. ACH payments can be made with no fee added. All payments are made through
    Square invoicing.</li>

    <li><strong>LATE PAYMENTS.</strong> Tuition is due on or before the <strong>25th day of each
    month</strong>, in the amount and on the dates set out in my Schedule of Tuition Payments. If
    the full amount due has not been received by the <strong>1st day of the following
    month</strong>, a late fee of <strong>$25 per day</strong> will be assessed automatically,
    for a maximum of <strong>five days ($125)</strong>.</li>

    <li><strong>SUSPENSION OF ACCESS.</strong> If my account has not been brought current
    &mdash; all tuition due plus any late fees assessed &mdash; by the end of that five-day
    period, {{student_name}}&rsquo;s <strong>access to his/her classes will be suspended</strong>
    until payment has been received. A suspension does not reduce or relieve any part of my
    tuition obligation.</li>

    <li>Tuition payments received are first applied against the oldest outstanding
    amounts.</li>
  </ol>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with everything in this section, including the figures set out above.</p>$c$, true, 1),
    ($c$contract_scholarships$c$, $c$Scholarships$c$, $c$<section>
  <h3>Scholarships (if applicable)</h3>
  <p>I understand the total published tuition amount is noted in my Schedule of Tuition Payments
  and provided to me by the School.</p>

  <p>I understand in order to receive any scholarship of any kind, I must upload and provide to
  the School, documentation from the entity providing these funds. This documentation must show
  the amount of funds being provided and any student reference number/ID.</p>

  <p>I understand any funds received from a scholarship will be deducted from
  {{student_name}}&rsquo;s total tuition amount as noted in the Schedule of Tuition
  Payments.</p>

  <p>I understand that if {{student_name}} is using or being provided a scholarship of any kind
  (including funds provided by the School) in the calculation or reduction of my monthly payment
  amounts, and I withdraw {{student_name}}, <strong>I remain responsible for any State
  Scholarship/Voucher amounts owed to the School for the amounts and dates set out in my
  Schedule of Tuition Payments</strong>, as described in CONTRACT TERM AND NOTIFICATION
  above.</p>

  <p>I understand the School will not release any academic records or complete/provide any
  student information requested by another school until all tuition owed has been
  satisfied.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with this section.</p>$c$, true, 2),
    ($c$contract_program_and_operations$c$, $c$Virtual services$c$, $c$<section>
  <h3>Virtual services</h3>
  <p>Responsible Parties understand and agree that while it is the intent of the School to
  provide these HS Virtual Services to their fullest extent to the Student without interruption
  and according to the agreed upon days, times, and School Calendar, there may be unforeseen
  weather conditions, acts of God, teacher illness, and situations and/or events which may
  prevent this on occasion from happening as planned. The School shall communicate whenever
  possible and with as much advanced notice as possible to Responsible Parties shall this be the
  case.</p>

  <p>Shall the HS Virtual Services be disrupted as described above, this does not release
  Responsible Parties of the full tuition obligations, nor does it obligate the School to refund
  or reduce any amount of these tuition funds, or makeup any missed class time or school
  days.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with this section.</p>$c$, true, 3),
    ($c$contract_conduct_and_consents$c$, $c$Conduct, consents and waivers$c$, $c$<section>
  <h3>Student conduct</h3>
  <p>The School reserves the right, and the Responsible Parties agree that the School shall have
  the right in the School&rsquo;s sole discretion, to suspend, dismiss or expel {{student_name}},
  and to revoke or terminate this HS Virtual Services Enrollment Contract for {{student_name}} for violation of or
  failure to comply with socially and educationally acceptable behavior norms and standards as
  determined by the School in its sole discretion, to warrant such action, including, but not
  limited to, inappropriate, disrespectful or unsatisfactory conduct, behavior or performance by
  the Student and inappropriate, disrespectful or unsupportive conduct, behavior or performance
  by the Responsible Parties.</p>
</section>

<section>
  <h3>Photo, video and related consent</h3>
  <p>The Responsible Parties hereby authorize without limitation the School, its successors and
  assigns, and those acting with its permission and upon its authority, to photograph, videotape,
  or film the Student for advertising, marketing, publicity or any other lawful purpose for the
  benefit of or relating to the School. Neither the Student nor the Responsible Parties shall be
  entitled to receive any compensation for such use, and the Responsible Parties hereby release
  the School, its successors and assigns, and those acting with its permission and upon its
  authority, from any liability, responsibility, or claim that may arise by reason of any
  exercise of the authority granted above. The School agrees to never use any specific
  identifying student information for any reason at any time for any of the above causes.</p>
</section>

<section>
  <h3>Other considerations</h3>
  <p>The School, in its sole discretion, shall be entitled to accept or reject this
  HS Virtual Services Enrollment Contract for any reason(s), including, but not limited to, the conduct of
  {{student_name}} or the conduct of the Responsible Parties. Acceptance of an Enrollment
  Contract for {{student_name}} for a previous academic year does not obligate the School to send
  an Enrollment Contract to the Responsible Parties for {{student_name}} for any subsequent
  academic year.</p>

  <p>The Responsible Parties agree that in the event {{student_name}} voluntarily withdraws from
  the School, or is suspended, dismissed or expelled from the School for any reason on or after
  the first day of classes, the month&rsquo;s tuition is due in full and payable by the
  Responsible Parties to the School.</p>
</section>

<section>
  <h3>Waiver of liability</h3>
  <p>The Responsible Parties agree that the participation by the Student in any School-related
  activity shall be undertaken at the Student&rsquo;s and Responsible Parties&rsquo; own risk.
  The School and its administrators, faculty, trustees, employees, agents, and contractors (all
  of the foregoing, collectively, the &ldquo;School Parties&rdquo;), shall not be liable for any
  claims, demands, injuries, damages, actions or causes of action whatsoever to the Student or
  the Responsible Parties or the Students&rsquo; or the Responsible Parties&rsquo; property
  arising out of, or connected with, the Student attending or participating in any activities
  of the School.</p>

  <p>The Responsible Parties do hereby expressly forever release and discharge the School Parties
  from all such claims, demands, injuries, damages, actions, or causes of action, and from all
  acts of active or passive negligence, including, without limitation, negligent supervision, on
  the part of the School Parties.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with this section.</p>$c$, true, 4),
    ($c$contract_acknowledgement$c$, $c$Acknowledgement and signature$c$, $c$<section>
  <h3>Acknowledgement</h3>
  <p>This HS Virtual Services Enrollment Contract shall be governed by and interpreted in accordance with the laws of
  the State of Georgia. This HS Virtual Services Enrollment Contract contains the entire agreements of the parties and
  supersedes all prior agreements, written or oral, between the parties. This HS Virtual Services Enrollment Contract
  may not be amended except in a written document signed by all parties that expressly
  acknowledges such amendment(s).</p>

  <p>This agreement may be executed in any number of counterparts and by different parties in
  separate counterparts. Each counterpart, when so executed, shall be deemed to be an original and
  all of which together shall constitute one and the same agreement.</p>

  <p>I/We, the Responsible Parties, parent(s) or legal guardian(s) financially responsible for
  {{student_name}}, have read and understand this HS Virtual Services Enrollment Contract, agree to the terms, and will
  abide by the terms as stated. My/Our signature(s) below indicate this understanding and
  agreement.</p>
</section>

<section>
  <h3>Signatures</h3>
  <table class="contract-facts">
    <tbody>
      <tr><th>Student</th><td>{{student_name}}</td></tr>
      <tr><th>School year</th><td>{{school_year}}</td></tr>
      <tr><th>Your responsibility</th><td>{{remaining_due}}</td></tr>
      <tr><th>Parent/Guardian/Responsible Party 1</th><td>{{guardian_1_name}}</td></tr>
    </tbody>
  </table>

  <p>The above signature(s) are of the Responsible Parties, Parent(s) or Legal Guardian(s)
  Financially Responsible for Student(s).</p>

  <p><strong>Agreed to and accepted by</strong><br />
  {{school_signatory}}</p>

  <p class="contract-binding">AFTER SUBMISSION OF THIS DOCUMENT, THIS HS VIRTUAL SERVICES
  ENROLLMENT CONTRACT BECOMES A FULLY BINDING AND ENFORCEABLE CONTRACT.</p>
</section>$c$, true, 5)
  ) as b(template_key, title, body_html, requires_signature, sort_order)
  cross join public.schools sc
 where lower(trim(sc.name)) = 'the academy hs'
on conflict (school_id, template_key) do update
   set title              = excluded.title,
       body_html          = excluded.body_html,
       requires_signature = excluded.requires_signature,
       state_code         = excluded.state_code,
       sort_order         = excluded.sort_order,
       is_active          = true,
       updated_at         = now();

-- The Academy Virtual
insert into public.enrollment_packet_templates
  (school_id, template_key, title, body_html, requires_signature, state_code, sort_order, is_active)
select sc.id, b.template_key, b.title, b.body_html, b.requires_signature, 'FL', b.sort_order, true
  from (values
    ($c$contract_tuition_and_payment$c$, $c$Virtual Services Enrollment and Tuition Contract — your figures and how you pay$c$, $c$<section>
  <h2>Virtual Services Enrollment and Tuition Contract</h2>
  <p>In consideration of, and subject to, the acceptance of this Virtual Services Enrollment and Tuition Contract by
  {{school_legal_name}} (hereinafter, the &ldquo;School&rdquo;), each of the undersigned
  parent(s) or legal guardian(s) (collectively, the &ldquo;Responsible Parties&rdquo;), jointly
  and severally agrees to pay the full monthly tuition for {{student_name}} (hereinafter, the
  &ldquo;Student&rdquo;). This Virtual Services Enrollment and Tuition Contract is a binding contract upon the Responsible
  Parties when signed and submitted to the School but is subject to final acceptance by the
  School. The language, terms, and conditions of this Virtual Services Enrollment and Tuition Contract are
  non-negotiable.</p>

  <table class="contract-facts">
    <tbody>
      <tr><th>Student</th><td>{{student_name}}</td></tr>
      <tr><th>School year</th><td>{{school_year}}</td></tr>
      <tr><th>School</th><td>{{school_name}}</td></tr>
      <tr><th>Parent/Guardian 1</th><td>{{guardian_1_name}}</td></tr>
    </tbody>
  </table>
</section>

<section>
  <h3>Contract term and notification</h3>
  <p>I understand and agree that this is a month to month contract. Responsible Parties can end
  this commitment at any time, however, there will be no proration or refund of any kind and
  regardless of when the School was notified.</p>

  <p>Responsible Parties agree to inform the School as early as possible by email of any planned
  change in enrollment as the School makes extraordinary efforts to group children together in
  the most effective manner possible at all times. Your child&rsquo;s withdrawal at an
  unscheduled time and other than the end of the school year may cause the School to make
  adjustments in other students&rsquo; schedules as well.</p>
</section>

<section>
  <h3>Schedule of Tuition Payments</h3>
  <p>I understand and agree that {{student_name}}&rsquo;s tuition will be according to the
  figures set out below, which form part of this Virtual Services Enrollment and Tuition Contract.</p>

  {{tuition_derivation}}

  {{schedule_of_payments}}
</section>

<section>
  <h3>Payment terms and conditions</h3>
  <p>Timely payment of tuition is a condition of continued enrollment. Responsible Parties shall
  make or designate payments to School no later than the 25th of each month and in order to
  continue to receive Virtual Services for the following month.</p>

  <p>If payments are made through Step Up, these funds must be designated to our school no later
  than the 25th of each month. Regardless if you are using Step Up or not, you will be sent an
  electronic invoice immediately after submission of this document to make your initial tuition
  payment. These Square invoices will be used to record any of your tuition payments. Each
  additional electronic monthly invoice thereafter will be sent on the 21st of each month to be
  due on the 25th of each month.</p>

  <p><strong>LATE PAYMENTS.</strong> Tuition is due on or before the <strong>25th day of each
  month</strong>, in the amounts and on the dates set out in my Schedule of Tuition Payments. If
  the full amount due has not been received by the <strong>1st day of the following
  month</strong>, a late fee of <strong>$25 per day</strong> will be assessed automatically, for
  a maximum of <strong>five days ($125)</strong>.</p>

  <p><strong>SUSPENSION OF ACCESS.</strong> If my account has not been brought current &mdash;
  all tuition due plus any late fees assessed &mdash; by the end of that five-day period,
  {{student_name}}&rsquo;s <strong>access to his/her classes will be suspended</strong> until
  payment has been received. A suspension does not reduce or relieve any part of my tuition
  obligation.</p>

  <p>I understand I can only make payments electronically through SQUARE.</p>
  <ul>
    <li>There is a 3% convenience fee added to each credit or debit card payment.</li>
    <li>ACH payments can be made with no convenience fee added. However, I must notify the school
    that I prefer to submit my payments in this manner before this can be made available to
    me.</li>
  </ul>

  <p>I understand and accept that there is no proration for services at any time and for any
  reason, regardless of when {{student_name}} begins, ends, and/or attends the School.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with everything in this section, including the figures set out above.</p>$c$, true, 1),
    ($c$contract_scholarships$c$, $c$Scholarships$c$, $c$<section>
  <h3>Scholarships (if applicable)</h3>
  <p>I understand the total published tuition amount is noted in my Schedule of Tuition Payments
  and provided to me by the School.</p>

  <p>I understand in order to receive any scholarship of any kind, I must upload and provide to
  the School, documentation from the entity providing these funds. This documentation must show
  the amount of funds being provided and any student reference number/ID.</p>

  <p>I understand any funds received from a scholarship will be deducted from
  {{student_name}}&rsquo;s total tuition amount as noted in the Schedule of Tuition
  Payments.</p>

  <p>I understand that if {{student_name}} is using or being provided a scholarship of any kind
  (including funds provided by the School) in the calculation or reduction of my monthly payment
  amounts, and I withdraw {{student_name}}, <strong>I remain responsible for any state
  scholarship or voucher amounts owed to the School for the amounts and dates set out in my
  Schedule of Tuition Payments</strong>, as described in STATE SCHOLARSHIP below.</p>

  <p>I understand the School will not release any academic records or complete/provide any
  student information requested by another school until all tuition owed has been
  satisfied.</p>
</section>

<section>
  <h3>State scholarship</h3>
  <p>Should you receive a state scholarship through Step Up and the Florida Department of
  Education, the amount you receive as indicated by the Department of Education will be deducted
  from the overall tuition amount. The remaining amount will then be spread out from Aug &ndash;
  May or prorated depending on enrollment date. This amount will be your monthly payment amount.
  These monthly payments will be due no later than the 25th day of each month.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with this section.</p>$c$, true, 2),
    ($c$contract_program_and_operations$c$, $c$Virtual services$c$, $c$<section>
  <h3>Virtual services</h3>
  <p>Responsible Parties understand and agree that services will be provided through The Academy
  Virtual and according to this Calendar. There will be no proration, refunds, or makeups at any
  time and regardless of the circumstances.</p>

  <p>Responsible Parties understand and agree that while it is the intent of the School to provide
  these Virtual Services to their fullest extent to the Student without interruption and according
  to the agreed upon days and time, there are unforeseen weather conditions, acts of God, teacher
  illness, and situations and/or events which may prevent this on occasion from happening as
  planned. The School shall communicate whenever possible and with as much advanced notice as
  possible to Responsible Parties shall this be the case.</p>

  <p>Shall Virtual Services be disrupted as described above, this does not release Responsible
  Parties of the full monthly tuition obligations, nor does it obligate the School to refund or
  reduce any amount of these tuition funds, or makeup any missed sessions.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with this section.</p>$c$, true, 3),
    ($c$contract_conduct_and_consents$c$, $c$Conduct, consents and waivers$c$, $c$<section>
  <h3>Student conduct</h3>
  <p>The School reserves the right, and the Responsible Parties agree that the School shall have
  the right in the School&rsquo;s sole discretion, to suspend, dismiss or expel {{student_name}},
  and to revoke or terminate this Virtual Services Enrollment and Tuition Contract for {{student_name}} for violation of or
  failure to comply with socially and educationally acceptable behavior norms and standards as
  determined by the School in its sole discretion, to warrant such action, including, but not
  limited to, inappropriate, disrespectful or unsatisfactory conduct, behavior or performance by
  the Student and inappropriate, disrespectful or unsupportive conduct, behavior or performance
  by the Responsible Parties.</p>
</section>

<section>
  <h3>Photo, video and related consent</h3>
  <p>The Responsible Parties hereby authorize without limitation the School, its successors and
  assigns, and those acting with its permission and upon its authority, to photograph, videotape,
  or film the Student for advertising, marketing, publicity or any other lawful purpose for the
  benefit of or relating to the School. Neither the Student nor the Responsible Parties shall be
  entitled to receive any compensation for such use, and the Responsible Parties hereby release
  the School, its successors and assigns, and those acting with its permission and upon its
  authority, from any liability, responsibility, or claim that may arise by reason of any
  exercise of the authority granted above. The School agrees to never use any specific
  identifying student information for any reason at any time for any of the above causes.</p>
</section>

<section>
  <h3>Other considerations</h3>
  <p>The School, in its sole discretion, shall be entitled to accept or reject this
  Virtual Services Enrollment and Tuition Contract for any reason(s), including, but not limited to, the conduct of
  {{student_name}} or the conduct of the Responsible Parties. Acceptance of a Virtual Services Enrollment and Tuition Contract
  for {{student_name}} for a previous academic year does not obligate the School to send a
  Virtual Services Enrollment and Tuition Contract to the Responsible Parties for {{student_name}} for any subsequent academic
  year.</p>

  <p>The Responsible Parties agree that in the event {{student_name}} voluntarily withdraws from
  the School, or is suspended, dismissed or expelled from the School for any reason on or after
  the first day of classes, the month&rsquo;s tuition is due and payable by the Responsible
  Parties to the School as full compensatory liquidated damages under this Virtual Services Enrollment and Tuition Contract, and
  not as a penalty; and that it is impossible to more precisely estimate the damage to be
  suffered by the School in the event of such withdrawal, suspension, dismissal or
  expulsion.</p>

  <p>The Responsible Parties acknowledge and agree that the School has needs and expectations for
  such tuition and has planned for payments of such tuition irrespective of any operating budget
  surplus that the School may have for such school year, for among other uses, to pay budgeted
  and unbudgeted operating costs and expenses.</p>
</section>

<section>
  <h3>Waiver of liability</h3>
  <p>The Responsible Parties agree that the participation by the Student in any School-related
  activity shall be undertaken at the Student&rsquo;s and Responsible Parties&rsquo; own risk.
  The School and its administrators, faculty, trustees, employees, agents, and contractors (all
  of the foregoing, collectively, the &ldquo;School Parties&rdquo;), shall not be liable for any
  claims, demands, injuries, damages, actions or causes of action whatsoever to the Student or
  the Responsible Parties or the Students&rsquo; or the Responsible Parties&rsquo; property
  arising out of, or connected with, the Student attending or participating in any activities
  of the School.</p>

  <p>The Responsible Parties do hereby expressly forever release and discharge the School Parties
  from all such claims, demands, injuries, damages, actions, or causes of action, and from all
  acts of active or passive negligence, including, without limitation, negligent supervision, on
  the part of the School Parties.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with this section.</p>$c$, true, 4),
    ($c$contract_acknowledgement$c$, $c$Acknowledgement and signature$c$, $c$<section>
  <h3>Acknowledgement</h3>
  <p>This Virtual Services Enrollment and Tuition Contract shall be governed by and interpreted in accordance with the laws of
  the State of Florida. This Virtual Services Enrollment and Tuition Contract contains the entire agreements of the parties and
  supersedes all prior agreements, written or oral, between the parties. This Virtual Services Enrollment and Tuition Contract
  may not be amended except in a written document signed by all parties that expressly
  acknowledges such amendment(s).</p>

  <p>This agreement may be executed in any number of counterparts and by different parties in
  separate counterparts. Each counterpart, when so executed, shall be deemed to be an original and
  all of which together shall constitute one and the same agreement.</p>

  <p>I/We, the Responsible Parties, parent(s) or legal guardian(s) financially responsible for
  {{student_name}}, have read and understand this Virtual Services Enrollment and Tuition Contract, agree to the terms, and will
  abide by the terms as stated. My/Our signature(s) below indicate this understanding and
  agreement.</p>
</section>

<section>
  <h3>Signatures</h3>
  <table class="contract-facts">
    <tbody>
      <tr><th>Student</th><td>{{student_name}}</td></tr>
      <tr><th>School year</th><td>{{school_year}}</td></tr>
      <tr><th>Your responsibility</th><td>{{remaining_due}}</td></tr>
      <tr><th>Parent/Guardian/Responsible Party 1</th><td>{{guardian_1_name}}</td></tr>
      <tr><th>Parent/Guardian/Responsible Party 2</th><td>{{guardian_2_name}}</td></tr>
    </tbody>
  </table>

  <p>The above signature(s) are of the Responsible Parties, Parent(s) or Legal Guardian(s)
  Financially Responsible for Student(s).</p>

  <p><strong>Agreed to and accepted by</strong><br />
  {{school_signatory}}</p>

  <p class="contract-binding">AFTER SUBMISSION OF THIS DOCUMENT, THIS VIRTUAL SERVICES ENROLLMENT
  CONTRACT BECOMES A FULLY BINDING AND ENFORCEABLE CONTRACT.</p>
</section>$c$, true, 5)
  ) as b(template_key, title, body_html, requires_signature, sort_order)
  cross join public.schools sc
 where lower(trim(sc.name)) = 'the academy virtual'
on conflict (school_id, template_key) do update
   set title              = excluded.title,
       body_html          = excluded.body_html,
       requires_signature = excluded.requires_signature,
       state_code         = excluded.state_code,
       sort_order         = excluded.sort_order,
       is_active          = true,
       updated_at         = now();

do $$
declare v int;
begin
  select count(*) into v
    from public.enrollment_packet_templates t
    join public.schools s on s.id = t.school_id
   where lower(trim(s.name)) in ('the academy fl', 'the academy hs', 'the academy virtual')
     and t.template_key like 'contract_%'
     and t.is_active and t.requires_signature;
  if v <> 15 then
    raise exception 'expected 15 active contract blocks across FL, HS and Virtual, found %', v;
  end if;
end $$;

commit;

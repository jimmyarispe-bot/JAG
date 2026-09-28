/**
 * The Academy GA Enrollment and Tuition Contract, as revised 6 September 2026.
 *
 * Source: Downloads/jag-import/ga-contract-revised-2026-09-06.md - the annotated
 * revision, with every change marked. The annotations are guidance for whoever
 * rebuilds the form and are NOT part of the contract; only the contract text is
 * below.
 *
 * GROUPED INTO FIVE BLOCKS, Jimmy's decision of 28 September. The paper
 * contract has a set of initials at roughly twenty points. Five blocks, each
 * initialled once, is the agreed trade: fewer clicks, and each block is still
 * a coherent subject a family can say yes to.
 *
 * THE SCHEDULE RENDERS HERE, it is not uploaded. Jimmy's decision of the same
 * day. The paper contract had the family upload a PDF the school had emailed
 * them; that wording is replaced with the figures themselves. Both places that
 * referred to the uploaded document now refer to the schedule below.
 *
 * WHAT IS DELIBERATELY NOT HERE:
 *   - Tuition insurance. It is an ELECTION, not an acknowledgement, and
 *     enrollment_packet_templates has no way to capture a choice. An offer a
 *     family cannot accept or decline has no business on a contract they sign.
 *   - The GA GOAL redirect limits still say "New Opportunity for 2022". They
 *     are Georgia statutory figures, four years stale, and not ours to guess.
 *     The section is here; the figures are marked for confirmation.
 */

export interface ContractBlock {
  readonly templateKey: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly requiresSignature: boolean;
  readonly bodyHtml: string;
}

const TUITION_AND_PAYMENT = `
<section>
  <h2>Enrollment and Tuition Contract</h2>
  <p>In consideration of, and subject to, the acceptance of this Enrollment and Tuition
  Contract by {{school_legal_name}} (hereinafter, the &ldquo;School&rdquo;), each of the
  undersigned parent(s) or legal guardian(s) (collectively, the &ldquo;Responsible
  Parties&rdquo;), jointly and severally agrees to pay the full tuition specified below for
  {{student_name}} (hereinafter, the &ldquo;Student&rdquo;). This Enrollment and Tuition
  Contract is a binding contract upon the Responsible Parties when signed and submitted to
  the School but is subject to final acceptance by the School. The language, terms, and
  conditions of this Enrollment and Tuition Contract are non-negotiable.</p>

  <p>Your initials or signature are required below in each section as acknowledgement and
  agreement. Any comments, statement or anything other than your initials or signature
  acknowledging your acceptance and agreement with the statements and information contained
  within are not valid, will be disregarded, and will not have any bearing or imply any
  negotiation or agreement on behalf of the School. The language, terms, and conditions of
  this Enrollment and Tuition Contract are non-negotiable and by submitting your initials
  and signature below, you understand and agree to this.</p>

  <table class="contract-facts">
    <tbody>
      <tr><th>Student</th><td>{{student_name}}</td></tr>
      <tr><th>Grade level for this contract year</th><td>{{student_grade}}</td></tr>
      <tr><th>School year</th><td>{{school_year}}</td></tr>
      <tr><th>School</th><td>{{school_name}}</td></tr>
      <tr><th>Responsible Party</th><td>{{guardian_1_name}}</td></tr>
    </tbody>
  </table>
</section>

<section>
  <h3>Emergency Contact and Medical Information</h3>
  <p>Make sure to complete this form as quickly as possible. {{student_name}} CANNOT attend
  our school and enrollment is not finalized until the Emergency Contact and Medical
  Information Form is completed and submitted.</p>
</section>

<section>
  <h3>Schedule of Tuition Payments</h3>
  <p>I understand and agree that {{student_name}}&rsquo;s tuition amount will be according to
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
    <li>I agree to make all tuition payments on time, understanding that this means on or
    before the 25th of each month if making monthly payments. Each monthly electronic invoice
    will be sent on the 20th of each month to be due on the 25th.</li>

    <li>I understand there are processing fees added to my invoice when paying by credit or
    debit card payment. ACH payments can be made with minimal convenience fees added.</li>

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
  <p>I understand if I fail to pay the full amount of my Parent-Payments as set out in my
  Schedule of Tuition Payments on or before the 25th day of each month, the <strong>LATE
  PAYMENTS</strong> and <strong>SUSPENSION OF ATTENDANCE</strong> terms above apply in full:
  a <strong>$25 per day</strong> late fee beginning the <strong>1st day of the following
  month</strong>, for a maximum of <strong>five days ($125)</strong>, after which
  {{student_name}}&rsquo;s attendance is <strong>suspended</strong> until my account is
  brought current.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with everything in this section, including the figures set out above.</p>
`.trim();

const SCHOLARSHIPS = `
<section>
  <h3>Scholarships</h3>
  <p>I understand the TOTAL published annual tuition amount is {{annual_tuition}}, as set out
  in my Schedule of Tuition Payments.</p>

  <p>I understand in order to receive any scholarship of any kind, I must upload and provide
  to the School documentation from the entity providing these funds. This documentation must
  show the amount of funds being provided and any student reference number/ID.</p>

  <p>I understand any funds received from a scholarship will be deducted from
  {{student_name}}&rsquo;s TOTAL annual tuition amount as set out in the Schedule of Tuition
  Payments.</p>

  <p>I understand if {{student_name}} is using or being provided a scholarship of any kind
  (including funds provided by the School) in the calculation and/or reduction of my tuition
  and/or monthly payment amounts, <strong>I am responsible for the entire remaining portion
  of the TOTAL and FULL published annual tuition amount of {{annual_tuition}} should I
  remove or withdraw {{student_name}} prior to the expiration date of this
  contract.</strong></p>

  <p>I understand the School will not release any academic records or complete/provide any
  student information requested by another school until the TOTAL annual tuition amount has
  been satisfied.</p>
</section>

<section>
  <h3>GA Special Needs Scholarship</h3>
  <p>Should you receive a GA Special Needs Scholarship from the GA Department of Education,
  the amount you receive as indicated by the Department of Education will be deducted from the
  overall tuition amount. The remaining amount will then be spread out from September to May,
  or prorated depending on enrollment date. This amount will be your monthly payment amount.
  These monthly payments will be due no later than the 25th day of each month.</p>
</section>

<section>
  <h3>Contributing to GA GOAL</h3>
  <p>The Georgia GOAL program is a no-cost way for you to donate your state taxes to
  {{school_name}}. We use these funds to provide scholarships for students to attend our
  school. GA GOAL allows you to redirect your Georgia tax payments to our school instead. In
  short &mdash; you can either give your taxes to the state government or you can give it to
  our school. It is a great way to support {{school_name}}&rsquo;s mission.</p>

  <p>Each calendar year, until the annual cap on available education expense credits is
  reached, Georgia statute sets the amount an individual, couple or business may redirect.
  Current limits are published by GOAL.</p>

  <p>I understand and will make every attempt possible to participate in the GA GOAL program
  each year {{student_name}} is enrolled in {{school_name}}.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with this section, including my responsibility for the full published tuition
if {{student_name}} is withdrawn before this contract expires.</p>
`.trim();

const PROGRAM_AND_OPERATIONS = `
<section>
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
  <p>By agreeing to this contract, the Responsible Parties acknowledge that they received the
  {{school_name}} Parent Handbook. The Responsible Party agrees to comply with the Parent
  Handbook along with an understanding that information may be added or changed during the
  school year as the school staff feels necessary. Should this occur, Responsible Parties will
  be notified of the specific changes immediately when they are made.</p>
</section>

<section>
  <h3>Laptop</h3>
  <p>I understand and agree to furnish {{student_name}} with a laptop (not iPad or tablet) to
  be used at school each day. Additionally, I agree to install any necessary child monitoring
  and safety application on this laptop to ensure {{student_name}} is only able to access
  appropriate age-related information. I agree it is not the School&rsquo;s responsibility and
  do not and will not hold the School liable for any situation where the student is using this
  device for non-school related purposes. Should this device be damaged or lost while at
  school, I will replace it or have it repaired as quickly as possible and not to exceed two
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
  Additionally, if the school determines in its sole discretion that it can no longer meet the
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
  regulations imposed by any governmental authority, civil unrest, riot, fire, floods, and any
  other cause not reasonably within the control of the School.</p>
</section>

<section>
  <h3>Off campus learning</h3>
  <p>At times, the School may deem it necessary and/or appropriate to take students off-campus
  to enhance their learning. This may occur within walking distance to nearby areas, and/or in
  staff vehicles to offsite driveable locations. Academy staff will notify parents via email at
  least the day prior whenever students are scheduled to be taken to an offsite location in
  staff vehicles. Additionally, parents will be given the address where students will be taken,
  expected timeframe of attendance, and an emergency school cell phone number.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of
and agreement with this section.</p>
`.trim();

const CONDUCT_AND_CONSENTS = `
<section>
  <h3>Student conduct</h3>
  <p>The School reserves the right, and the Responsible Parties agree that the School shall
  have the right in the School&rsquo;s sole discretion, to suspend, dismiss or expel
  {{student_name}}, and to revoke or terminate this Enrollment and Tuition Contract for
  {{student_name}}, for violation of or failure to comply with socially and educationally
  acceptable behavior norms and standards as determined by the School in its sole discretion
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
  <h3>Waiver of liability</h3>
  <p>The Responsible Parties agree that the participation by the Student in any School-related
  activity shall be undertaken at the Student&rsquo;s and Responsible Parties&rsquo; own risk.
  The School and its administrators, faculty, trustees, employees, agents, volunteers and
  contractors (all of the foregoing, collectively, the &ldquo;School Parties&rdquo;), shall not
  be liable for any claims, demands, injuries, damages, actions or causes of action whatsoever
  to the Student or the Responsible Parties or the Student&rsquo;s or the Responsible
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
  the registered student to and from the School and releases all School Parties from all such
  claims, demands, injuries, damages, actions, or causes of action, and from all acts of active
  or passive negligence, including, without limitation, negligent supervision, on the part of
  the School Parties, or the condition or defect, whether visible or latent, of any vehicle,
  equipment or other personal property used for transporting students in which the School has an
  ownership, leasehold, or other interest.</p>
</section>

<section>
  <h3>Other considerations</h3>
  <p>The School, in its sole discretion, is entitled to accept or reject this Enrollment and
  Tuition Contract for any reason and at any time, including, but not limited to, the conduct of
  {{student_name}} or the conduct of the Responsible Parties. Acceptance of this Enrollment and
  Tuition Contract for {{student_name}} for a previous academic year does not obligate the School
  to send an Enrollment and Tuition Contract to the Responsible Parties for {{student_name}} for
  any subsequent academic year. The obligation to pay tuition for the full year is unconditional,
  notwithstanding the subsequent dismissal, expulsion, withdrawal, or absence for any reason of
  the Student.</p>

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
  unbudgeted (1) operating costs and expenses, (2) costs and expenses of maintenance, repair,
  replacement, and/or installation or construction of improvements, fixtures, systems and
  equipment, (3) outstanding indebtedness owed by the School, and (4) increasing the School&rsquo;s
  endowment.</p>
</section>

<p class="contract-initials">By typing my initials below, I acknowledge my understanding of and
agreement with this section.</p>
`.trim();

const ACKNOWLEDGEMENT = `
<section>
  <h3>Acknowledgement</h3>
  <p>This Enrollment and Tuition Contract shall be governed by and interpreted in accordance with
  the laws of the State of Georgia. This Enrollment and Tuition Contract contains the entire
  agreements of the parties and supersedes all prior agreements, written or oral, between the
  parties. This Enrollment and Tuition Contract may not be amended except in a written document
  signed by all parties that expressly acknowledges such amendment(s).</p>

  <p>This agreement may be executed in any number of counterparts and by different parties in
  separate counterparts. Each counterpart, when so executed, shall be deemed to be an original and
  all of which together shall constitute one and the same agreement.</p>

  <p>I/We, the Responsible Parties, parent(s) or legal guardian(s) financially responsible for
  {{student_name}}, have read and understand this Enrollment and Tuition Contract, agree to the
  terms, and will abide by the terms as stated.</p>

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
  Jimmy Arispe<br />
  CEO/Founder, {{school_legal_name}}</p>

  <p class="contract-binding">AFTER SUBMISSION OF THIS DOCUMENT, THIS ENROLLMENT AND TUITION
  CONTRACT BECOMES A FULLY BINDING AND ENFORCEABLE CONTRACT.</p>
</section>
`.trim();

export const GA_CONTRACT_BLOCKS: readonly ContractBlock[] = [
  {
    templateKey: "contract_tuition_and_payment",
    title: "Enrollment and Tuition Contract — your figures and how you pay",
    sortOrder: 1,
    requiresSignature: true,
    bodyHtml: TUITION_AND_PAYMENT,
  },
  {
    templateKey: "contract_scholarships",
    title: "Scholarships",
    sortOrder: 2,
    requiresSignature: true,
    bodyHtml: SCHOLARSHIPS,
  },
  {
    templateKey: "contract_program_and_operations",
    title: "Program and operations",
    sortOrder: 3,
    requiresSignature: true,
    bodyHtml: PROGRAM_AND_OPERATIONS,
  },
  {
    templateKey: "contract_conduct_and_consents",
    title: "Conduct, consents and waivers",
    sortOrder: 4,
    requiresSignature: true,
    bodyHtml: CONDUCT_AND_CONSENTS,
  },
  {
    templateKey: "contract_acknowledgement",
    title: "Acknowledgement and signature",
    sortOrder: 5,
    requiresSignature: true,
    bodyHtml: ACKNOWLEDGEMENT,
  },
];

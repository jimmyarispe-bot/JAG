/**
 * The Academy HS - HS Virtual Services Enrollment Contract, as revised
 * 6 September 2026.
 *
 * Source: claude/hs-contract-revised-2026-09-06.md. Annotations are guidance
 * and are NOT part of the contract. Loaded 18 October 2026 with every change
 * marked in that document, including the two it left as Jimmy's call: the
 * non-negotiable sentence (in) and the scholarship rewrite (in).
 *
 * MONTH TO MONTH. HS owes "the full monthly tuition" - never the annual
 * wording FL and GA use. No clause here makes a family liable for a year.
 *
 * BUILT THE WAY GA WAS: five blocks each initialled once; the Schedule of
 * Tuition Payments renders on the face rather than being uploaded (so the old
 * "if this did not apply to you, your monthly tuition payments are $850"
 * fallback is replaced by the family's own figures); the signatory comes from
 * the school record.
 *
 * NOT HERE: the scholarship documentation upload field. A signed block cannot
 * carry an upload.
 *
 * STILL FOR THE ATTORNEY, AS THE 6 SEPTEMBER DOCUMENT SAYS: Georgia law
 * governs a contract serving Florida and virtual students; HS collects one
 * signature while binding the Responsible Parties "jointly and severally"; and
 * the scholarship rewrite narrows what the school can claim.
 */

import type { ContractBlock } from "./ga-2026-09-06";

const CONTRACT_NAME = "HS Virtual Services Enrollment Contract";

const TUITION_AND_PAYMENT = `
<section>
  <h2>${CONTRACT_NAME}</h2>
  <p>In consideration of, and subject to, the acceptance of this ${CONTRACT_NAME} by
  {{school_legal_name}} (hereinafter, the &ldquo;School&rdquo;), each of the undersigned
  parent(s) or legal guardian(s) (collectively, the &ldquo;Responsible Parties&rdquo;), jointly
  and severally agrees to pay the full monthly tuition for {{student_name}} (hereinafter, the
  &ldquo;Student&rdquo;). This ${CONTRACT_NAME} is a binding contract upon the Responsible
  Parties when signed and submitted to the School but is subject to final acceptance by the
  School. The language, terms, and conditions of this ${CONTRACT_NAME} are
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
  figures set out below, which form part of this ${CONTRACT_NAME}.</p>

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
and agreement with everything in this section, including the figures set out above.</p>
`.trim();

const SCHOLARSHIPS = `
<section>
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
and agreement with this section.</p>
`.trim();

const PROGRAM_AND_OPERATIONS = `
<section>
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
and agreement with this section.</p>
`.trim();

const CONDUCT_AND_CONSENTS = `
<section>
  <h3>Student conduct</h3>
  <p>The School reserves the right, and the Responsible Parties agree that the School shall have
  the right in the School&rsquo;s sole discretion, to suspend, dismiss or expel {{student_name}},
  and to revoke or terminate this ${CONTRACT_NAME} for {{student_name}} for violation of or
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
  ${CONTRACT_NAME} for any reason(s), including, but not limited to, the conduct of
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
and agreement with this section.</p>
`.trim();

const ACKNOWLEDGEMENT = `
<section>
  <h3>Acknowledgement</h3>
  <p>This ${CONTRACT_NAME} shall be governed by and interpreted in accordance with the laws of
  the State of Georgia. This ${CONTRACT_NAME} contains the entire agreements of the parties and
  supersedes all prior agreements, written or oral, between the parties. This ${CONTRACT_NAME}
  may not be amended except in a written document signed by all parties that expressly
  acknowledges such amendment(s).</p>

  <p>This agreement may be executed in any number of counterparts and by different parties in
  separate counterparts. Each counterpart, when so executed, shall be deemed to be an original and
  all of which together shall constitute one and the same agreement.</p>

  <p>I/We, the Responsible Parties, parent(s) or legal guardian(s) financially responsible for
  {{student_name}}, have read and understand this ${CONTRACT_NAME}, agree to the terms, and will
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
</section>
`.trim();

export const HS_CONTRACT_BLOCKS: readonly ContractBlock[] = [
  {
    templateKey: "contract_tuition_and_payment",
    title: `${CONTRACT_NAME} — your figures and how you pay`,
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
    title: "Virtual services",
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

/**
 * The Academy Virtual - Virtual Services Enrollment and Tuition Contract, as
 * revised 6 September 2026.
 *
 * Source: claude/fl-virtual-contract-revised-2026-09-06.md. Annotations are
 * guidance and are NOT part of the contract. Loaded 18 October 2026 with every
 * change marked in that document, including the two left as Jimmy's call: the
 * non-negotiable sentence (in) and the scholarship rewrite (in).
 *
 * MONTH TO MONTH. "The full monthly tuition", never the annual wording.
 *
 * THE FAMILY CONTRACTS WITH THREE ENTITIES ("The Academy FL, LLC., The Academy
 * Virtual, LLC. and/or The Academy HS, LLC."), exactly as the contract has
 * always named them - schools.contracting_legal_name, migration 448. Whether
 * one contract should bind a family to three LLCs on an "and/or" basis is the
 * attorney's question the 6 September document leaves open.
 *
 * BUILT THE WAY GA WAS: five blocks each initialled once; the Schedule of
 * Tuition Payments renders on the face (the "Upload Your Schedule of Tuition
 * Payments" field is gone with it); signatory from the school record.
 *
 * NOT HERE: the Step Up documentation upload field. A signed block cannot
 * carry an upload. Its paragraph stays.
 *
 * ONE THING THE 6 SEPTEMBER DOCUMENT FLAGGED AND DID NOT CHANGE: this contract
 * spreads a state scholarship Aug - May; GA's says Sept - May. Left as written.
 */

import type { ContractBlock } from "./ga-2026-09-06";

const CONTRACT_NAME = "Virtual Services Enrollment and Tuition Contract";

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
  figures set out below, which form part of this ${CONTRACT_NAME}.</p>

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
and agreement with this section.</p>
`.trim();

const PROGRAM_AND_OPERATIONS = `
<section>
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
  {{student_name}} or the conduct of the Responsible Parties. Acceptance of a ${CONTRACT_NAME}
  for {{student_name}} for a previous academic year does not obligate the School to send a
  ${CONTRACT_NAME} to the Responsible Parties for {{student_name}} for any subsequent academic
  year.</p>

  <p>The Responsible Parties agree that in the event {{student_name}} voluntarily withdraws from
  the School, or is suspended, dismissed or expelled from the School for any reason on or after
  the first day of classes, the month&rsquo;s tuition is due and payable by the Responsible
  Parties to the School as full compensatory liquidated damages under this ${CONTRACT_NAME}, and
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
and agreement with this section.</p>
`.trim();

const ACKNOWLEDGEMENT = `
<section>
  <h3>Acknowledgement</h3>
  <p>This ${CONTRACT_NAME} shall be governed by and interpreted in accordance with the laws of
  the State of Florida. This ${CONTRACT_NAME} contains the entire agreements of the parties and
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
      <tr><th>Parent/Guardian/Responsible Party 2</th><td>{{guardian_2_name}}</td></tr>
    </tbody>
  </table>

  <p>The above signature(s) are of the Responsible Parties, Parent(s) or Legal Guardian(s)
  Financially Responsible for Student(s).</p>

  <p><strong>Agreed to and accepted by</strong><br />
  {{school_signatory}}</p>

  <p class="contract-binding">AFTER SUBMISSION OF THIS DOCUMENT, THIS VIRTUAL SERVICES ENROLLMENT
  CONTRACT BECOMES A FULLY BINDING AND ENFORCEABLE CONTRACT.</p>
</section>
`.trim();

export const VIRTUAL_CONTRACT_BLOCKS: readonly ContractBlock[] = [
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

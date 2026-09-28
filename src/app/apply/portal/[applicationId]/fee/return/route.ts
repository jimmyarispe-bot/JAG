import { NextResponse, type NextRequest } from "next/server";

import { confirmApplicationFeePayment } from "@/lib/admissions/fee/checkout";

/**
 * Where Square drops the family after they pay.
 *
 * THIS ROUTE READS NOTHING FROM THE REQUEST BUT THE APPLICATION ID IN ITS OWN
 * PATH. Square appends its own parameters, and a parent - or anyone who has
 * seen the link - can append whatever they like. None of it is consulted. The
 * confirmation reads the order id this system stored before the family ever
 * left, asks Square about that order, and decides from the answer.
 *
 * So the worst a forged return URL achieves is making us ask Square a question
 * we already knew the answer to.
 *
 * IT ALWAYS REDIRECTS TO THE APPLICATION. Whether the payment confirmed, is
 * still settling, or failed, the family lands back on their own page, which
 * reads the fee state fresh and says where things stand. A payment page that
 * ends on an error screen is how somebody pays twice.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  const { applicationId } = await context.params;

  // A failure here is not shown to the family as an error. The page they are
  // about to land on reads the fee itself and will say "not paid yet" if that
  // is the truth - and it offers a Check button that runs this same
  // confirmation again. Square can take a moment to complete an order.
  try {
    await confirmApplicationFeePayment(applicationId);
  } catch {
    // Deliberately swallowed. See above: the destination page is the one that
    // tells the family anything, and it does not depend on this call.
  }

  /**
   * Built from `nextUrl`, not `request.url`. Behind Vercel's proxy the raw url
   * can carry the internal host, and a redirect to that would strand the
   * family on an address their browser cannot reach. `nextUrl` already has the
   * forwarded host applied. The query string is dropped: nothing Square
   * appended is wanted on the page.
   */
  const destination = request.nextUrl.clone();
  destination.pathname = `/apply/portal/${encodeURIComponent(applicationId)}`;
  destination.search = "";
  return NextResponse.redirect(destination);
}

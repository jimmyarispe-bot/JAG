import { NextResponse, type NextRequest } from "next/server";

import { confirmApplicationFeePayment } from "@/lib/admissions/fee/checkout";

/**
 * Where Square drops a family who has no account.
 *
 * The sibling of /apply/portal/[applicationId]/fee/return, and it exists for
 * the reason that route could not serve: it redirects to /apply/portal/<id>,
 * which bounces anyone without a session to a password box. So before
 * 30 September a family could pay and land on /login - money taken, nothing
 * to show for it.
 *
 * THIS ROUTE READS NOTHING FROM THE REQUEST BUT THE TOKEN IN ITS OWN PATH.
 * Square appends its own parameters and anyone who has seen the link can
 * append whatever they like; none of it is consulted. The confirmation reads
 * the order id this system stored before the family ever left, asks Square
 * about that order, and decides from the answer. The worst a forged return
 * URL achieves is making us ask Square a question we already knew.
 *
 * IT ALWAYS REDIRECTS TO THE APPLICATION. Confirmed, still settling or
 * failed, the family lands back on the page they were filling in, which reads
 * the fee fresh and says where things stand. A payment page that ends on an
 * error screen is how somebody pays twice.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  /*
   * Swallowed deliberately, as on the portal route. The page they are about
   * to land on reads the fee itself, says "not paid yet" if that is the
   * truth, and offers a Check button that runs this same confirmation again.
   * Square can take a moment to complete an order.
   */
  try {
    await confirmApplicationFeePayment({ token });
  } catch {
    // See above.
  }

  /*
   * Built from `nextUrl`, not `request.url`. Behind Vercel's proxy the raw
   * url can carry the internal host, and a redirect to that would strand the
   * family on an address their browser cannot reach.
   */
  const destination = request.nextUrl.clone();
  destination.pathname = `/apply/start/${encodeURIComponent(token)}`;
  destination.search = "";
  return NextResponse.redirect(destination);
}

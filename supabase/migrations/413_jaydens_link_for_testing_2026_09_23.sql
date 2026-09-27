/*
  413 — JAYDEN'S APPLICATION LINK, FOR JIMMY TO WALK BEFORE ANY FAMILY DOES

  WHY BY HAND. The token is normally minted when a school leader answers the
  invite_to_apply gate. Nina answered Jayden's on 22 September, before the
  token existed, so no invitation will fire for him again and there is nothing
  to trigger the mint.

  WHAT THIS DOES. Mints his token if he has none and prints the URL. Nothing is
  emailed. Lisa Roy is not contacted. The only change to the database is one
  token on one lead.

  IDEMPOTENT. mint_application_access_token returns the existing token rather
  than replacing it, so running this twice cannot invalidate a link already
  sitting in somebody's inbox.

  WHAT TO DO WITH THE RESULT. Open the URL in a private window - a normal
  window may carry your staff session and prove nothing, since the whole claim
  being tested is that this works with NO account.

  WHAT YOU SHOULD SEE:
    - "Jayden Roy's application to The Academy GA"
    - "Hello Lisa Roy"
    - seven questions, some already carrying what the family told us on their
      inquiry
    - Submit application, and Save and finish later

  WHAT WOULD MEAN IT IS BROKEN:
    - a sign-in page                -> the route is not deployed yet
    - "This link is no longer active" -> the token did not mint; re-run this
    - empty questions               -> carry-forward did not run. Not fatal -
      the family can still apply - but worth knowing before 27 others do it.

  DO NOT PRESS SUBMIT. Submitting marks Jayden's application received, moves
  his stage to application_submitted and emails Lisa the shadow-days
  invitation for real. Fill in a field, press "Save and finish later", reload
  the page, and confirm what you typed is still there. That proves the write
  path without sending anything to a family.
*/

select
  'Open this in a private window' as instruction,
  'https://apply.theacademyway.org/apply/start/'
    || public.mint_application_access_token('66f94d1c-37d9-4ae3-88a4-b1168636e8a2')
    as url;

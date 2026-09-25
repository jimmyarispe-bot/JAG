-- IS ANYONE'S EMAIL AT A DEAD DOMAIN - 25 September 2026
--
-- Renee's verification row appeared to read theacademyHYS.org. Her real
-- address is renee.tracewell@theacademyhs.org. If the account carries the
-- typo, she can still sign in - she knows her password - but every email the
-- JAG sends her is delivered to a domain that does not exist, silently.
--
-- Rather than squint at one row, this asks the question of every account:
-- which email domains exist in this system, and how many people sit on each.
-- A domain with one or two people on it, next to a near-identical domain with
-- many, is a typo.
--
-- ONE statement. READ ONLY.

select
  split_part(lower(au.email), '@', 2)                       as domain,
  count(*)                                                  as accounts,
  string_agg(au.email, ', ' order by au.email)              as who
from auth.users au
where au.email is not null
group by split_part(lower(au.email), '@', 2)
order by accounts desc, domain;

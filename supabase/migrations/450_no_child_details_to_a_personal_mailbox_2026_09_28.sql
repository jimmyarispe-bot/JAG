-- 450: A CHILD'S DETAILS STOP GOING TO A PERSONAL MAILBOX.
--
-- Two acceptance notifications reached jimmy.arispe@gmail.com - Jayden Roy at
-- The Academy GA on 25 September, Rashard Salinding at The Academy Virtual on
-- 28 September. Each carried the child's name, their campus, their parent's
-- name and email address, and a live link to the record, into a mailbox
-- Google controls and the network does not.
--
-- THERE WERE TWO CAUSES, AND ONLY ONE OF THEM IS IN THIS FILE.
--
--   1. src/lib/admissions/communications/network-office.ts defaulted
--      NETWORK_OFFICE_EMAIL to that Gmail. ADMISSIONS_NETWORK_OFFICE_EMAIL was
--      never set, so the default ran, and it is added to the recipients of
--      every acceptance at every campus. That is what sent both of these.
--      Fixed in code, with a test that now refuses any address outside the
--      network's domains.
--
--   2. The Academy FL's contact row carries the same Gmail, so he is also on
--      FL's ordinary inquiry notices. That is this migration. It did NOT cause
--      the two above - neither child is at FL - and finding it did not explain
--      them. Worth saying plainly, because a fix that matches the symptom is
--      the easiest wrong answer available.
--
-- He stays a contact at FL; only the address changes. Removing him would also
-- have stopped the FL inquiry notices he presumably wants.

begin;

update public.school_admissions_contacts
   set email = 'jimmy.arispe@theacademyway.org'
 where lower(trim(email)) = 'jimmy.arispe@gmail.com';

-- Belt and braces: the fallback column had none of these when measured on
-- 28 September, but changing one place and not the other is how this survives.
update public.schools
   set admissions_contact_email = 'jimmy.arispe@theacademyway.org'
 where lower(trim(admissions_contact_email)) = 'jimmy.arispe@gmail.com';

/*
  PROVE IT. No notification recipient anywhere is on a consumer mailbox.

  Deliberately broader than the one address: if the Gmail got onto a recipient
  list, the question is not whether that one address is gone but whether any
  other is there. This refuses on the class, not the instance.
*/
do $$
declare
  v_offenders text;
begin
  select string_agg(distinct src, '; ' order by src) into v_offenders
    from (
      select sc.name || ' -> ' || c.email as src
        from public.school_admissions_contacts c
        join public.schools sc on sc.id = c.school_id
       where c.email ~* '@(gmail|yahoo|hotmail|outlook|aol|icloud|live|msn|comcast)\.'
      union all
      select sc.name || ' -> ' || sc.admissions_contact_email
        from public.schools sc
       where sc.admissions_contact_email ~* '@(gmail|yahoo|hotmail|outlook|aol|icloud|live|msn|comcast)\.'
    ) o;

  if v_offenders is not null then
    raise exception
      'a child''s details would still be sent to a personal mailbox: %', v_offenders;
  end if;

  raise notice 'No admissions notification recipient is on a consumer mailbox. The network office default is fixed separately, in code.';
end $$;

commit;

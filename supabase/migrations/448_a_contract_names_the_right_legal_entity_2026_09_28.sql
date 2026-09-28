-- 448: A CONTRACT NAMES THE ENTITY THE FAMILY IS ACTUALLY CONTRACTING WITH.
--
-- 447 put the real GA contract into the database and it carried the legal
-- entity as literal text: "The Academy GA, LLC. dba The Academy". That works
-- exactly once. The moment FL, HS or Virtual get theirs, the name has to come
-- from the school record, because the four are not variations on a theme:
--
--   GA       The Academy GA, LLC. dba The Academy
--   FL       The Academy FL, LLC. dba The Academy
--   HS       The Academy HS, LLC.
--   Virtual  The Academy FL, LLC., The Academy Virtual, LLC.
--            and/or The Academy HS, LLC.      <- three entities, jointly
--
-- AND WHO SIGNS IS NOT THE SAME QUESTION. At GA and FL the signatory acts for
-- the campus. At HS he acts for the network AND the campus; at Virtual for all
-- three LLCs. One column would have produced a wrong answer at half the
-- campuses, so there are two.
--
-- Every value below is transcribed from that campus's own 6 September contract
-- - the opening paragraph for the contracting entity, the "Agreed to and
-- Accepted by" block for the signatory. None is derived from the campus name,
-- because the relationship between the two is not a pattern.
--
-- NULL IS THE REFUSAL. A school with no contracting_legal_name cannot have a
-- contract rendered for it. That is deliberate: a contract naming the wrong
-- legal entity, or naming a campus where an LLC belongs, is worse than no
-- contract. Any school added later starts NULL and stays unable to send one
-- until somebody states the entity.

begin;

alter table public.schools
  add column if not exists contracting_legal_name text,
  add column if not exists signatory_line text;

comment on column public.schools.contracting_legal_name is
  'The legal entity or entities a family contracts with, exactly as that '
  'campus''s contract names them. NULL means no contract can be rendered.';
comment on column public.schools.signatory_line is
  'Who signs for the school and on behalf of which entities. Differs from '
  'contracting_legal_name at HS and Virtual.';

update public.schools sc
   set contracting_legal_name = v.contracting,
       signatory_line         = v.signatory,
       updated_at             = now()
  from (values
          ('The Academy GA',
           'The Academy GA, LLC. dba The Academy',
           'Jimmy Arispe, CEO/Founder of The Academy GA, LLC.'),
          ('The Academy FL',
           'The Academy FL, LLC. dba The Academy',
           'Jimmy Arispe, CEO/Founder of The Academy FL, LLC.'),
          ('The Academy HS',
           'The Academy HS, LLC.',
           'Jimmy Arispe, Founder and CEO of The Academy Way Network of Schools, LLC. and The Academy HS, LLC.'),
          ('The Academy Virtual',
           'The Academy FL, LLC., The Academy Virtual, LLC. and/or The Academy HS, LLC.',
           'Jimmy Arispe, Founder of The Academy Virtual, LLC., The Academy FL, LLC. and The Academy HS, LLC.')
       ) as v(school_name, contracting, signatory)
 where lower(trim(sc.name)) = lower(v.school_name);

/*
  PROVE IT. All four campuses named, and no campus left holding its own
  display name where an LLC belongs - which is the specific mistake this
  column exists to prevent.
*/
do $$
declare
  v_named int;
  v_lazy  int;
begin
  select count(*) into v_named
    from public.schools
   where contracting_legal_name is not null
     and signatory_line is not null;

  if v_named < 4 then
    raise exception 'expected the four campuses to be named, found %', v_named;
  end if;

  select count(*) into v_lazy
    from public.schools
   where contracting_legal_name is not null
     and contracting_legal_name = name;

  if v_lazy > 0 then
    raise exception
      '% school(s) carry their display name as their legal entity, which is not a legal entity', v_lazy;
  end if;

  raise notice 'Four campuses carry a contracting entity and a signatory; any school added later starts NULL and cannot send a contract until somebody states its entity';
end $$;

commit;

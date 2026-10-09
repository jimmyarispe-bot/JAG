-- 473_ten_children_put_back_together_2026_10_02.sql
--
-- THIS WRITES. Ten children, one rename, and it moves nothing it cannot
-- account for.
--
-- WHAT HAPPENED. Migration 464 put in the roll of 2 October by matching each
-- child by name. Ten children were spelled differently in the roll from the
-- record already on file, so 464 did exactly what it was told: it did not
-- recognise them, created ten new children, and marked the ten real records
-- inactive. Nothing failed, so nothing was reported.
--
-- The result was ten pairs. One of each pair holds the student number and
-- everything hanging off it. The other was born this morning and is empty -
-- and is the one teachers have been seeing in their grids all afternoon.
--
-- WHICH NAME IS RIGHT came from Jimmy's corrected roll of 2 October, not from
-- my judgement about which spelling looked more plausible. In seven cases the
-- record on file was right and the roll had the typo. In one - Christian
-- Rubio - the roll was right and the record was wrong. Izrael and Zion
-- Alexander are a family name, not a misspelling, and both siblings keep it.
--
-- EVERY PAIR IS ADDRESSED BY ID, never by name. The ids come from the query
-- that found them. A merge that re-matched on names would be the same class
-- of mistake that caused this.
--
-- WHAT EACH MERGE DOES:
--
--   1. Any child already tapped onto a class this afternoon against the
--      EMPTY record is moved onto the real one. A teacher who logged Olsen
--      Peters at two o'clock keeps that work, attached to the child who
--      actually has a history. Where both records are somehow on the same
--      class, the duplicate line is dropped rather than collided.
--   2. The real record is given the correct name and switched back on.
--   3. The empty record is switched off. NOT DELETED - a delete cascades,
--      and nothing here is worth a cascade.
--
-- ALSO IN THIS FILE: Israel (Josiah) KCooks -> Israel (Josiah) Cooks. A
-- simple typo, no duplicate, confirmed by the corrected roll.
--
-- 471 IS SUPERSEDED. Do not run it. It tried to rename Fiona by name, which
-- is how the two Fionas were found in the first place.
--
-- AFTER THIS the roll is unchanged in size: 78 active. Ten active records
-- become inactive and ten inactive ones become active, in pairs.
--
-- Safe to re-run: a pair already merged has nothing left to move and the
-- names are set to the same values again.

begin;

do $$
declare
  r        record;
  v_moved  int;
  v_total  int := 0;
begin
  for r in
    select * from (values
      -- keep (has the number)                    drop (born today)                        correct name
      ('c9daf7b5-faf6-4127-a87a-9514e698e91c'::uuid, '0dc93613-d3dc-4202-87cd-30c5045e6bde'::uuid, 'Izrael',          'Alexander'),
      ('fc86a3af-6e8e-4c9b-8974-9838dab7ad7b'::uuid, '7f1c7370-35f1-4d2f-9854-2dec0a81655f'::uuid, 'Zion',            'Alexander'),
      ('71c33c00-8ace-40ef-b9cb-ec9473045870'::uuid, '6c6ae527-a2e0-44e6-bdc6-ac8b29b36abd'::uuid, 'Dante',           'Neason'),
      ('57c96b7a-e407-4f57-b7d1-57f27d1816a3'::uuid, '75149fe5-7186-4f58-a30f-be444c347e7b'::uuid, 'Oliver',          'Winiarczyk'),
      ('db60763e-4ba2-4b28-81b0-199bfe098f49'::uuid, '8a780157-c217-4ec1-91fd-43a71c2d87d7'::uuid, 'Santiago',        'Alvarado'),
      ('3815dd71-31a9-4ed0-886b-daa3d24389af'::uuid, 'a010ee30-2012-452a-a084-5d18ebcc9873'::uuid, 'Fiona',           'Drescher'),
      ('47c0ff96-c68a-4465-bfc4-2d229caa9ea3'::uuid, 'dc7ed872-e0f6-4b52-87bc-f777789f5acd'::uuid, 'Christian',       'Rubio'),
      ('06d03e55-d48b-44ee-882f-0adfd990b7ad'::uuid, '75fecc7e-1e2d-4fe6-a88d-d458dc7cd295'::uuid, 'Hudson',          'Bowden'),
      ('0d042d79-a8dd-47fa-8e6b-eeb7c896958d'::uuid, '536399e3-0867-4515-ae71-2aae84564398'::uuid, 'William',         'Sifonte'),
      ('7a4cc812-427b-4231-9093-b6371a71d1e9'::uuid, '779624b5-741f-4f2d-be8b-41bace49e7ee'::uuid, 'Olson',           'Peters')
    ) as t(keep_id, drop_id, first_name, last_name)
  loop
    if not exists (select 1 from public.students where id = r.keep_id)
    or not exists (select 1 from public.students where id = r.drop_id) then
      raise exception 'One of the two records for % % no longer exists. Nothing changed.',
        r.first_name, r.last_name;
    end if;

    /* 1. Classwork logged against the empty record moves to the real one.
          Where the real child is already on that class, the duplicate line
          is dropped - the same child cannot be on one class twice. */
    delete from public.teacher_class_students d
     where d.student_id = r.drop_id
       and exists (select 1 from public.teacher_class_students k
                    where k.entry_id = d.entry_id and k.student_id = r.keep_id);

    update public.teacher_class_students
       set student_id = r.keep_id
     where student_id = r.drop_id;

    get diagnostics v_moved = row_count;
    v_total := v_total + v_moved;

    /* 2. The real record: correct name, switched back on. Its student
          number is not touched. */
    update public.students
       set first_name = r.first_name,
           last_name  = r.last_name,
           status     = 'active',
           updated_at = now()
     where id = r.keep_id;

    /* 3. The empty record: switched off, not deleted. */
    update public.students
       set status = 'inactive',
           updated_at = now()
     where id = r.drop_id;

    raise notice '% %: merged, % class line(s) moved.', r.first_name, r.last_name, v_moved;
  end loop;

  raise notice 'Ten children put back together. % class line(s) moved in total.', v_total;

  /* Israel (Josiah) KCooks -> Cooks. One record, no duplicate. */
  update public.students
     set last_name  = 'Cooks',
         first_name = 'Israel (Josiah)',
         updated_at = now()
   where regexp_replace(lower(coalesce(last_name,'')), '[^a-z0-9]', '', 'g') = 'kcooks';

  if found then
    raise notice 'Israel (Josiah) KCooks is now Israel (Josiah) Cooks.';
  else
    raise notice 'No child called KCooks - already corrected, or spelled another way.';
  end if;
end $$;

commit;

-- ── VERIFY 1 of 2 ────────────────────────────────────────────────────────────
-- EXPECT eleven rows, every one active, every one with a student number
-- except Israel if he never had one.
--
-- A name appearing TWICE means a merge did not take and must be looked at
-- before any teacher logs against it.

select trim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,''))  as child,
       coalesce(sc.name, '(no school)')                                    as school,
       coalesce(s.status, '')                                              as status,
       coalesce(to_jsonb(s) ->> 'student_number', '(none)')                as student_number
  from public.students s
  left join public.schools sc on sc.id = s.school_id
 where (s.first_name, s.last_name) in (
         ('Izrael','Alexander'), ('Zion','Alexander'), ('Dante','Neason'),
         ('Oliver','Winiarczyk'), ('Santiago','Alvarado'), ('Fiona','Drescher'),
         ('Christian','Rubio'), ('Hudson','Bowden'), ('William','Sifonte'),
         ('Olson','Peters'), ('Israel (Josiah)','Cooks')
       )
 order by 2, 1;

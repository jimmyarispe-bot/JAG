-- =========================================
-- WAVE 2: ULR SL SUB-STRANDS — GENERATED LIBRARIES (152)
-- Sub-strands from competency library specs (Docs 62, 84–97)
-- Idempotent: safe to re-run
-- =========================================

insert into public.platform_ulr_sub_strands (sub_strand_key, strand_key, domain_key, title, sort_order, status, published_at)
values
  ('domain.structured_literacy.sub_strand.pm_isolation', 'domain.structured_literacy.strand.phonemic_awareness', 'domain.structured_literacy', 'PM Isolation', 10, 'published', now()),
  ('domain.structured_literacy.sub_strand.pm_blend_segment', 'domain.structured_literacy.strand.phonemic_awareness', 'domain.structured_literacy', 'PM Blend Segment', 20, 'published', now()),
  ('domain.structured_literacy.sub_strand.pm_manipulation', 'domain.structured_literacy.strand.phonemic_awareness', 'domain.structured_literacy', 'PM Manipulation', 30, 'published', now()),
  ('domain.structured_literacy.sub_strand.pm_handoff', 'domain.structured_literacy.strand.phonemic_awareness', 'domain.structured_literacy', 'PM Handoff', 40, 'published', now()),
  ('domain.structured_literacy.sub_strand.ap_alphabet', 'domain.structured_literacy.strand.alphabetic_principle', 'domain.structured_literacy', 'AP Alphabet', 10, 'published', now()),
  ('domain.structured_literacy.sub_strand.ap_conceptual', 'domain.structured_literacy.strand.alphabetic_principle', 'domain.structured_literacy', 'AP Conceptual', 20, 'published', now()),
  ('domain.structured_literacy.sub_strand.ap_mapping', 'domain.structured_literacy.strand.alphabetic_principle', 'domain.structured_literacy', 'AP Mapping', 30, 'published', now()),
  ('domain.structured_literacy.sub_strand.dec_closed', 'domain.structured_literacy.strand.decoding', 'domain.structured_literacy', 'Decoding Closed Syllable', 10, 'published', now()),
  ('domain.structured_literacy.sub_strand.enc_phonetic', 'domain.structured_literacy.strand.encoding', 'domain.structured_literacy', 'Encoding Phonetic', 10, 'published', now()),
  ('domain.structured_literacy.sub_strand.om_mapping', 'domain.structured_literacy.strand.orthographic_mapping', 'domain.structured_literacy', 'OM Mapping', 10, 'published', now()),
  ('domain.structured_literacy.sub_strand.mor_inflections', 'domain.structured_literacy.strand.morphology', 'domain.structured_literacy', 'Morphology Inflections', 10, 'published', now()),
  ('domain.structured_literacy.sub_strand.flu_accuracy', 'domain.structured_literacy.strand.fluency', 'domain.structured_literacy', 'Fluency Accuracy', 10, 'published', now()),
  ('domain.structured_literacy.sub_strand.voc_tiers', 'domain.structured_literacy.strand.vocabulary', 'domain.structured_literacy', 'Vocabulary Tiers', 10, 'published', now()),
  ('domain.structured_literacy.sub_strand.rc_comprehension', 'domain.structured_literacy.strand.comprehension', 'domain.structured_literacy', 'Reading Comprehension', 10, 'published', now()),
  ('domain.structured_literacy.sub_strand.we_sentence', 'domain.structured_literacy.strand.writing_connections', 'domain.structured_literacy', 'Written Expression Sentence', 10, 'published', now()),
  ('domain.structured_literacy.sub_strand.trf_transfer', 'domain.structured_literacy.strand.writing_connections', 'domain.structured_literacy', 'SL Transfer', 20, 'published', now())
on conflict (sub_strand_key) do nothing;

notify pgrst, 'reload schema';

-- =========================================
-- WAVE 2: ULR STRUCTURED LITERACY POPULATION (151)
-- Doc 13 strands + Doc 98 PA sub-strands
-- Idempotent: safe to re-run
-- =========================================

-- Complete Doc 13 strand architecture (7 strands beyond migration 149)
insert into public.platform_ulr_strands (strand_key, domain_key, title, description, sort_order, status, published_at)
values
  ('domain.structured_literacy.strand.encoding', 'domain.structured_literacy', 'Encoding & Spelling', 'Spelling and written encoding', 45, 'published', now()),
  ('domain.structured_literacy.strand.orthographic_mapping', 'domain.structured_literacy', 'Orthographic Mapping', 'Sight word storage and orthographic mapping', 55, 'published', now()),
  ('domain.structured_literacy.strand.morphology', 'domain.structured_literacy', 'Morphology', 'Prefixes, suffixes, roots', 65, 'published', now()),
  ('domain.structured_literacy.strand.vocabulary', 'domain.structured_literacy', 'Vocabulary', 'Word meaning and usage', 85, 'published', now()),
  ('domain.structured_literacy.strand.writing_connections', 'domain.structured_literacy', 'Writing Connections', 'Literacy writing integration', 105, 'published', now()),
  ('domain.structured_literacy.strand.wrs_progression', 'domain.structured_literacy', 'WRS Step Progression', 'Wilson Step band framework mapping', 115, 'published', now()),
  ('domain.structured_literacy.strand.og_principles', 'domain.structured_literacy', 'Orton-Gillingham Principles', 'Multisensory structured literacy fidelity', 125, 'published', now())
on conflict (strand_key) do nothing;

-- Document 98 phonological awareness sub-strands
insert into public.platform_ulr_sub_strands (sub_strand_key, strand_key, domain_key, title, description, sort_order, status, published_at)
values
  ('domain.structured_literacy.sub_strand.sentence_awareness', 'domain.structured_literacy.strand.phonological_awareness', 'domain.structured_literacy', 'Sentence Awareness', 'Word boundary identification within spoken sentences', 10, 'published', now()),
  ('domain.structured_literacy.sub_strand.syllable_awareness', 'domain.structured_literacy.strand.phonological_awareness', 'domain.structured_literacy', 'Syllable Awareness', 'Syllable blend, segment, count, and manipulation', 20, 'published', now()),
  ('domain.structured_literacy.sub_strand.rhyme_alliteration', 'domain.structured_literacy.strand.phonological_awareness', 'domain.structured_literacy', 'Rhyme & Alliteration', 'Rhyme recognition, production, discrimination, alliteration', 30, 'published', now()),
  ('domain.structured_literacy.sub_strand.onset_rime_awareness', 'domain.structured_literacy.strand.phonological_awareness', 'domain.structured_literacy', 'Onset-Rime Awareness', 'Onset-rime blend, segment, and manipulation', 40, 'published', now()),
  ('domain.structured_literacy.sub_strand.phoneme_readiness_bridge', 'domain.structured_literacy.strand.phonological_awareness', 'domain.structured_literacy', 'Phoneme Readiness Bridge', 'Capstone PA competencies bridging to Phonemic Awareness', 50, 'published', now())
on conflict (sub_strand_key) do nothing;

notify pgrst, 'reload schema';

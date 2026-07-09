-- =========================================
-- WAVE 2: ULR SEED — SIX PRODUCTION LEARNING DOMAINS (149)
-- Idempotent: safe to re-run
-- =========================================

insert into public.platform_ulr_domains (domain_key, domain_code, title, description, version, status, sort_order, published_at)
values
  ('domain.structured_literacy', 'SL', 'Structured Literacy', 'Wilson-aligned structured literacy domain', '1.0.0', 'published', 10, now()),
  ('domain.real_life_math', 'RLM', 'Real-Life Math', 'Applied mathematics for authentic life contexts', '1.0.0', 'published', 20, now()),
  ('domain.litlab', 'LL', 'LitLab', 'Literature, discussion, and communication domain', '1.0.0', 'published', 30, now()),
  ('domain.earthology', 'EO', 'Earthology', 'Environmental science and stewardship domain', '1.0.0', 'published', 40, now()),
  ('domain.life_lab', 'LLB', 'Life Lab', 'Life skills and adult readiness domain', '1.0.0', 'published', 50, now()),
  ('domain.ai_venture_lab', 'AVL', 'AI Venture Lab', 'Entrepreneurship and AI-enabled venture domain', '1.0.0', 'published', 60, now())
on conflict (domain_key) do nothing;

-- Structured Literacy strands (Doc 13)
insert into public.platform_ulr_strands (strand_key, domain_key, title, sort_order, status, published_at)
values
  ('domain.structured_literacy.strand.phonological_awareness', 'domain.structured_literacy', 'Phonological Awareness', 10, 'published', now()),
  ('domain.structured_literacy.strand.phonemic_awareness', 'domain.structured_literacy', 'Phonemic Awareness', 20, 'published', now()),
  ('domain.structured_literacy.strand.alphabetic_principle', 'domain.structured_literacy', 'Alphabetic Principle', 30, 'published', now()),
  ('domain.structured_literacy.strand.decoding', 'domain.structured_literacy', 'Decoding', 40, 'published', now()),
  ('domain.structured_literacy.strand.fluency', 'domain.structured_literacy', 'Fluency', 50, 'published', now()),
  ('domain.structured_literacy.strand.comprehension', 'domain.structured_literacy', 'Comprehension', 60, 'published', now())
on conflict (strand_key) do nothing;

-- Real-Life Math strands (subset Doc 14)
insert into public.platform_ulr_strands (strand_key, domain_key, title, sort_order, status, published_at)
values
  ('domain.real_life_math.strand.money', 'domain.real_life_math', 'Money', 10, 'published', now()),
  ('domain.real_life_math.strand.budgeting', 'domain.real_life_math', 'Budgeting', 20, 'published', now()),
  ('domain.real_life_math.strand.problem_solving', 'domain.real_life_math', 'Problem Solving', 30, 'published', now())
on conflict (strand_key) do nothing;

-- LitLab, Earthology, Life Lab, AI Venture Lab starter strands
insert into public.platform_ulr_strands (strand_key, domain_key, title, sort_order, status, published_at)
values
  ('domain.litlab.strand.reading', 'domain.litlab', 'Reading', 10, 'published', now()),
  ('domain.litlab.strand.discussion', 'domain.litlab', 'Discussion', 20, 'published', now()),
  ('domain.earthology.strand.inquiry', 'domain.earthology', 'Scientific Inquiry', 10, 'published', now()),
  ('domain.earthology.strand.stewardship', 'domain.earthology', 'Environmental Stewardship', 20, 'published', now()),
  ('domain.life_lab.strand.financial_literacy', 'domain.life_lab', 'Financial Literacy', 10, 'published', now()),
  ('domain.life_lab.strand.career_readiness', 'domain.life_lab', 'Career Readiness', 20, 'published', now()),
  ('domain.ai_venture_lab.strand.venture_design', 'domain.ai_venture_lab', 'Venture Design', 10, 'published', now()),
  ('domain.ai_venture_lab.strand.ai_literacy', 'domain.ai_venture_lab', 'AI Literacy', 20, 'published', now())
on conflict (strand_key) do nothing;

-- Sub-strands — foundational tier pattern per domain
insert into public.platform_ulr_sub_strands (sub_strand_key, strand_key, domain_key, title, sort_order, status, published_at)
values
  ('domain.structured_literacy.strand.phonological_awareness.sub_strand.foundational', 'domain.structured_literacy.strand.phonological_awareness', 'domain.structured_literacy', 'Foundational Phonological Awareness', 10, 'published', now()),
  ('domain.real_life_math.strand.money.sub_strand.foundational', 'domain.real_life_math.strand.money', 'domain.real_life_math', 'Foundational Money Skills', 10, 'published', now()),
  ('domain.litlab.strand.reading.sub_strand.foundational', 'domain.litlab.strand.reading', 'domain.litlab', 'Foundational Reading', 10, 'published', now()),
  ('domain.earthology.strand.inquiry.sub_strand.foundational', 'domain.earthology.strand.inquiry', 'domain.earthology', 'Foundational Inquiry', 10, 'published', now()),
  ('domain.life_lab.strand.financial_literacy.sub_strand.foundational', 'domain.life_lab.strand.financial_literacy', 'domain.life_lab', 'Foundational Financial Literacy', 10, 'published', now()),
  ('domain.ai_venture_lab.strand.venture_design.sub_strand.foundational', 'domain.ai_venture_lab.strand.venture_design', 'domain.ai_venture_lab', 'Foundational Venture Design', 10, 'published', now())
on conflict (sub_strand_key) do nothing;

notify pgrst, 'reload schema';

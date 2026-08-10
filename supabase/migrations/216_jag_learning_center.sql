-- =========================================
-- 216: JAG Learning Center
-- Product tutorials + user progress/preferences.
-- Separate from jag_learning_records (intelligence feedback)
-- and from AcademyOS / Mr. JAG in-memory catalogs.
-- =========================================

create table if not exists public.jag_learn_tutorials (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  code text not null unique,
  title text not null,
  description text not null default '',
  category text not null default 'essentials'
    check (category in ('orientation', 'essentials', 'help')),
  difficulty text not null default 'beginner'
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_minutes integer not null default 2
    check (estimated_minutes > 0 and estimated_minutes <= 120),
  -- Null = all authorized JAG users; otherwise capability id gate.
  required_capability_id text,
  product text not null default 'jag'
    check (product = 'jag'),
  content jsonb not null default '{}'::jsonb,
  video_url text,
  walkthrough_id text,
  page_id text not null,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jag_learn_tutorials_active_sort
  on public.jag_learn_tutorials(is_active, sort_order);

create table if not exists public.jag_learn_user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tutorial_id uuid not null references public.jag_learn_tutorials(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed', 'skipped')),
  progress_percent integer not null default 0
    check (progress_percent >= 0 and progress_percent <= 100),
  current_step integer not null default 0
    check (current_step >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, tutorial_id)
);

create index if not exists idx_jag_learn_user_progress_user
  on public.jag_learn_user_progress(user_id, updated_at desc);

create table if not exists public.jag_learn_user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  first_login_completed boolean not null default false,
  onboarding_started_at timestamptz,
  onboarding_completed_at timestamptz,
  onboarding_skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jag_learn_tutorials enable row level security;
alter table public.jag_learn_user_progress enable row level security;
alter table public.jag_learn_user_preferences enable row level security;

-- Catalog is readable by any authenticated user; writes are service/migration only.
drop policy if exists jag_learn_tutorials_select on public.jag_learn_tutorials;
create policy jag_learn_tutorials_select on public.jag_learn_tutorials
  for select to authenticated
  using (is_active = true);

-- Progress is strictly own-row (JAG session userId == auth.uid()).
drop policy if exists jag_learn_user_progress_own on public.jag_learn_user_progress;
create policy jag_learn_user_progress_own on public.jag_learn_user_progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists jag_learn_user_preferences_own on public.jag_learn_user_preferences;
create policy jag_learn_user_preferences_own on public.jag_learn_user_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select on public.jag_learn_tutorials to authenticated;
grant select, insert, update, delete on public.jag_learn_user_progress to authenticated;
grant select, insert, update, delete on public.jag_learn_user_preferences to authenticated;

-- Seed JAG-native tutorials (IDs + content mirrored in application catalog).
insert into public.jag_learn_tutorials (
  id, slug, code, title, description, category, difficulty, estimated_minutes,
  required_capability_id, product, content, video_url, walkthrough_id, page_id,
  is_active, sort_order
) values
(
  '00000000-0000-4000-8000-000000000001',
  'welcome-to-the-jag',
  'JAG-001',
  'Welcome to The JAG',
  'Orient to The JAG™ as your organizational intelligence command center.',
  'orientation',
  'beginner',
  2,
  null,
  'jag',
  '{"summary":"The JAG™ is your organizational intelligence command center.","steps":[{"title":"What The JAG is","body":"The JAG™ composes executive intelligence from identity, role, permissions, evidence, and organizational state — not a second portal or LMS."},{"title":"What you will learn","body":"Use Learning Center to understand Overview, Conversation, Inbox, Decisions, Listening, Briefings, Scenarios, Memory, and Strategy."},{"title":"Stay in Learning Center","body":"Return anytime from Learn in the Command Center navigation. Executive Onboarding (/jag/onboarding) is platform provisioning and is separate."}]}'::jsonb,
  null,
  'wt.jag.welcome',
  'jag.overview',
  true,
  10
),
(
  '00000000-0000-4000-8000-000000000002',
  'navigating-command-center',
  'JAG-002',
  'Navigating Your JAG Command Center',
  'Learn the Command Center sidebar and how experiences are composed.',
  'orientation',
  'beginner',
  3,
  null,
  'jag',
  '{"summary":"Navigate The JAG™ Command Center with confidence.","steps":[{"title":"Sidebar destinations","body":"Primary navigation lists Overview, Learn, and intelligence surfaces enabled for your workspace."},{"title":"Capability gates","body":"Items appear when your organization has the capability enabled. You will not see destinations you are not authorized to use."},{"title":"Settings vs Learning","body":"Settings covers brand and account chrome. Learn covers product orientation and tutorials — not org provisioning."}]}'::jsonb,
  null,
  'wt.jag.navigation',
  'jag.overview',
  true,
  20
),
(
  '00000000-0000-4000-8000-000000000003',
  'using-executive-conversation',
  'JAG-003',
  'Using Executive Conversation',
  'Ask evidence-backed executive questions — not a general chatbot.',
  'essentials',
  'beginner',
  3,
  'jag.intelligence.conversation',
  'jag',
  '{"summary":"Executive Conversation answers from bound evidence.","steps":[{"title":"Open Conversation","body":"Use Conversation in the sidebar (/jag/chat). It is evidence-backed executive Q&A, not a chatbot and not the JAG Coach."},{"title":"Grounded answers","body":"Answers cite organizational signals when available. Unbound or empty signals are stated explicitly — the system does not invent metrics."},{"title":"When to use Coach instead","body":"For “how do I use JAG?” and navigation help, open Learn → AI Coach. Keep Conversation for organizational intelligence questions."}]}'::jsonb,
  null,
  'wt.jag.conversation',
  'jag.conversation',
  true,
  30
),
(
  '00000000-0000-4000-8000-000000000004',
  'understanding-your-inbox',
  'JAG-004',
  'Understanding Your Inbox',
  'Review watcher alerts and actionable executive signals.',
  'essentials',
  'beginner',
  2,
  'jag.intelligence.watchers',
  'jag',
  '{"summary":"Inbox surfaces watcher-driven executive attention.","steps":[{"title":"Open Inbox","body":"Inbox (/jag/inbox) lists watcher alerts and attention items for your workspace."},{"title":"Act on signals","body":"Use inbox items as entry points into Decisions, Listening, or other intelligence surfaces — it does not invent alerts without watchers."}]}'::jsonb,
  null,
  'wt.jag.inbox',
  'jag.inbox',
  true,
  40
),
(
  '00000000-0000-4000-8000-000000000005',
  'decision-center',
  'JAG-005',
  'Decision Center',
  'Track and advance organizational decisions with evidence.',
  'essentials',
  'beginner',
  3,
  'jag.decisions.center',
  'jag',
  '{"summary":"Decision Center holds decision records and follow-through.","steps":[{"title":"Open Decision Center","body":"Decisions (/jag/decisions) lists decision records for the active organization."},{"title":"Detail and evidence","body":"Open a decision to review status, related evidence, and next actions as implemented in production — empty states mean no fabricated decisions."}]}'::jsonb,
  null,
  'wt.jag.decisions',
  'jag.decisions',
  true,
  50
),
(
  '00000000-0000-4000-8000-000000000006',
  'listening-and-intelligence',
  'JAG-006',
  'Listening & Listening Intelligence',
  'Run listening instruments and review intelligence outputs.',
  'essentials',
  'beginner',
  3,
  'jag.intelligence.listening',
  'jag',
  '{"summary":"Listening captures stakeholder signal; Intelligence analyzes it.","steps":[{"title":"Listening home","body":"Listening (/jag/listening) manages campaigns, instruments, and versions for structured listening."},{"title":"Listening Intelligence","body":"Listening Intelligence (/jag/listening/intelligence) surfaces analysis runs and signals when data exists — it does not invent segment insights."}]}'::jsonb,
  null,
  'wt.jag.listening',
  'jag.listening',
  true,
  60
),
(
  '00000000-0000-4000-8000-000000000007',
  'executive-briefings',
  'JAG-007',
  'Executive Briefings',
  'Generate and review executive briefings from organizational signals.',
  'essentials',
  'beginner',
  3,
  'jag.intelligence.briefings',
  'jag',
  '{"summary":"Briefings assemble executive-ready summaries.","steps":[{"title":"Open Briefings","body":"Briefings (/jag/briefings) lists briefing artifacts for your workspace."},{"title":"Review a briefing","body":"Open a briefing to read the structured summary. Content reflects available evidence — empty workspaces show empty states."}]}'::jsonb,
  null,
  'wt.jag.briefings',
  'jag.briefings',
  true,
  70
),
(
  '00000000-0000-4000-8000-000000000008',
  'scenario-planner',
  'JAG-008',
  'Scenario Planner',
  'Explore hypothetical organizational scenarios without inventing facts.',
  'essentials',
  'beginner',
  3,
  'jag.intelligence.scenarios',
  'jag',
  '{"summary":"Scenario Planner models hypothetical changes.","steps":[{"title":"Open Scenarios","body":"Scenario Planner (/jag/scenarios) lists available scenario templates and runs."},{"title":"Interpret carefully","body":"Scenarios are planning aids. They do not replace evidence-backed Conversation answers about current state."}]}'::jsonb,
  null,
  'wt.jag.scenarios',
  'jag.scenarios',
  true,
  80
),
(
  '00000000-0000-4000-8000-000000000009',
  'memory',
  'JAG-009',
  'Memory',
  'Review retained organizational memory used by intelligence surfaces.',
  'essentials',
  'beginner',
  2,
  'jag.intelligence.memory',
  'jag',
  '{"summary":"Memory retains organizational context for intelligence.","steps":[{"title":"Open Memory","body":"Memory (/jag/memory) shows retained organizational memory entries available to the workspace."},{"title":"How it is used","body":"Other intelligence surfaces may reference memory. Empty memory means nothing has been retained yet — not an error."}]}'::jsonb,
  null,
  'wt.jag.memory',
  'jag.memory',
  true,
  90
),
(
  '00000000-0000-4000-8000-000000000010',
  'strategy',
  'JAG-010',
  'Strategy',
  'Review mission, pillars, and strategic intelligence for the organization.',
  'essentials',
  'beginner',
  3,
  'jag.intelligence.strategy',
  'jag',
  '{"summary":"Strategy holds mission and strategic structure.","steps":[{"title":"Open Strategy","body":"Strategy (/jag/strategy) presents mission, pillars, and related strategic intelligence for the active organization."},{"title":"Keep it evidence-aligned","body":"Strategy reflects configured organizational intent. Pair it with Decisions and Briefings for execution follow-through."}]}'::jsonb,
  null,
  'wt.jag.strategy',
  'jag.strategy',
  true,
  100
)
on conflict (slug) do nothing;

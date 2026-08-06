-- =============================================================================
-- 214 — JAG Listening Intelligence foundation (Slice 1)
-- Durable schema + Foundation II RLS + public collection security RPCs.
-- Forward-only. Does NOT modify migrations <= 212.
-- Does NOT build AI, UI, briefings, conversations, or decision integration.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 0) Permissions
-- ---------------------------------------------------------------------------
insert into public.platform_permissions (
  permission_key, name, description, module, category, sort_order
)
values
  (
    'LISTENING_VIEW',
    'Listening View',
    'View organization listening initiatives, campaigns, and non-raw intelligence.',
    'listening',
    'access',
    220
  ),
  (
    'LISTENING_MANAGE',
    'Listening Manage',
    'Create, publish, and close listening initiatives, instruments, and campaigns.',
    'listening',
    'access',
    221
  ),
  (
    'LISTENING_ANALYZE',
    'Listening Analyze',
    'Run and accept/reject listening analysis (deterministic/AI) for an organization.',
    'listening',
    'access',
    222
  ),
  (
    'LISTENING_RAW',
    'Listening Raw Responses',
    'View raw listening responses and answers (privileged; confidentiality-sensitive).',
    'listening',
    'access',
    223
  )
on conflict (permission_key) do update set
  name = excluded.name,
  description = excluded.description,
  module = excluded.module,
  category = excluded.category,
  sort_order = excluded.sort_order;

-- Platform stewards: full listening control plane
insert into public.platform_role_permissions (role_id, permission_key, effect)
select r.id, p.permission_key, 'allow'
from public.roles r
cross join public.platform_permissions p
where r.name in ('PLATFORM_OWNER', 'FOUNDER')
  and p.permission_key in (
    'LISTENING_VIEW',
    'LISTENING_MANAGE',
    'LISTENING_ANALYZE',
    'LISTENING_RAW'
  )
on conflict (role_id, permission_key) do nothing;

-- Customer org admin: org-scoped listening (including raw for their org only via RLS)
insert into public.platform_role_permissions (role_id, permission_key, effect)
select r.id, p.permission_key, 'allow'
from public.roles r
cross join public.platform_permissions p
where r.name = 'JAG_ORG_ADMIN'
  and p.permission_key in (
    'LISTENING_VIEW',
    'LISTENING_MANAGE',
    'LISTENING_ANALYZE',
    'LISTENING_RAW'
  )
on conflict (role_id, permission_key) do nothing;

-- ---------------------------------------------------------------------------
-- 1) Core tables
-- ---------------------------------------------------------------------------

create table if not exists public.listening_initiatives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  title text not null,
  purpose text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'closed', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint listening_initiatives_org_id_unique unique (organization_id, id)
);

create index if not exists idx_listening_initiatives_org_status
  on public.listening_initiatives(organization_id, status, created_at desc);

create table if not exists public.listening_instruments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  initiative_id uuid,
  title text not null,
  description text not null default '',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint listening_instruments_org_id_unique unique (organization_id, id),
  constraint listening_instruments_initiative_org_fk
    foreign key (organization_id, initiative_id)
    references public.listening_initiatives(organization_id, id)
    on delete set null
);

create index if not exists idx_listening_instruments_org
  on public.listening_instruments(organization_id, created_at desc);

create table if not exists public.listening_instrument_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  instrument_id uuid not null,
  version_no integer not null check (version_no >= 1),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'retired')),
  published_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint listening_instrument_versions_org_id_unique unique (organization_id, id),
  constraint listening_instrument_versions_instrument_unique
    unique (instrument_id, version_no),
  constraint listening_instrument_versions_instrument_org_fk
    foreign key (organization_id, instrument_id)
    references public.listening_instruments(organization_id, id)
    on delete cascade
);

create index if not exists idx_listening_instrument_versions_instrument
  on public.listening_instrument_versions(instrument_id, version_no desc);

create table if not exists public.listening_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  instrument_version_id uuid not null,
  -- Stable identity across instrument versions for longitudinal comparison
  question_key text not null,
  question_type text not null
    check (question_type in (
      'single_choice',
      'multi_choice',
      'likert',
      'numeric',
      'nps',
      'ranking',
      'short_text',
      'long_text',
      'yes_no',
      'matrix'
    )),
  prompt text not null,
  help_text text not null default '',
  required boolean not null default true,
  display_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  analysis_hints jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint listening_questions_org_id_unique unique (organization_id, id),
  constraint listening_questions_version_key_unique
    unique (instrument_version_id, question_key),
  constraint listening_questions_version_org_fk
    foreign key (organization_id, instrument_version_id)
    references public.listening_instrument_versions(organization_id, id)
    on delete cascade
);

create index if not exists idx_listening_questions_version_order
  on public.listening_questions(instrument_version_id, display_order);

create table if not exists public.listening_question_options (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  question_id uuid not null,
  option_key text not null,
  label text not null,
  display_order integer not null default 0,
  value_numeric numeric,
  created_at timestamptz not null default now(),
  constraint listening_question_options_org_id_unique unique (organization_id, id),
  constraint listening_question_options_question_key_unique
    unique (question_id, option_key),
  constraint listening_question_options_question_org_fk
    foreign key (organization_id, question_id)
    references public.listening_questions(organization_id, id)
    on delete cascade
);

create index if not exists idx_listening_question_options_question
  on public.listening_question_options(question_id, display_order);

create table if not exists public.listening_segments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  segment_key text not null,
  label text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint listening_segments_org_key_unique unique (organization_id, segment_key),
  constraint listening_segments_org_id_unique unique (organization_id, id)
);

create index if not exists idx_listening_segments_org
  on public.listening_segments(organization_id, label);

create table if not exists public.listening_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  initiative_id uuid not null,
  instrument_version_id uuid not null,
  title text not null,
  introduction text not null default '',
  privacy_statement text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'open', 'closed', 'archived')),
  privacy_mode text not null default 'anonymous'
    check (privacy_mode in ('anonymous', 'confidential', 'identified')),
  -- SHA-256 digest of opaque public bearer token (never store plaintext)
  public_token_hash bytea,
  opens_at timestamptz,
  closes_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  -- Future analytics guardrail default (not enforced in Slice 1 aggregators)
  min_cohort_size integer not null default 5 check (min_cohort_size >= 1),
  constraint listening_campaigns_org_id_unique unique (organization_id, id),
  constraint listening_campaigns_initiative_org_fk
    foreign key (organization_id, initiative_id)
    references public.listening_initiatives(organization_id, id)
    on delete cascade,
  constraint listening_campaigns_version_org_fk
    foreign key (organization_id, instrument_version_id)
    references public.listening_instrument_versions(organization_id, id)
    on delete restrict
);

create unique index if not exists idx_listening_campaigns_token_hash
  on public.listening_campaigns(public_token_hash)
  where public_token_hash is not null;

create index if not exists idx_listening_campaigns_org_status
  on public.listening_campaigns(organization_id, status, created_at desc);

create table if not exists public.listening_campaign_segments (
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  campaign_id uuid not null,
  segment_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (campaign_id, segment_id),
  constraint listening_campaign_segments_campaign_org_fk
    foreign key (organization_id, campaign_id)
    references public.listening_campaigns(organization_id, id)
    on delete cascade,
  constraint listening_campaign_segments_segment_org_fk
    foreign key (organization_id, segment_id)
    references public.listening_segments(organization_id, id)
    on delete cascade
);

create table if not exists public.listening_response_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  campaign_id uuid not null,
  -- Optional SHA-256 of one-time/session bearer (V1 may omit; reserved)
  session_token_hash bytea,
  status text not null default 'open'
    check (status in ('open', 'submitted', 'expired', 'revoked')),
  -- Identified/confidential linkage (null for anonymous)
  respondent_user_id uuid references public.users(id) on delete set null,
  expires_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint listening_response_sessions_org_id_unique unique (organization_id, id),
  constraint listening_response_sessions_campaign_org_fk
    foreign key (organization_id, campaign_id)
    references public.listening_campaigns(organization_id, id)
    on delete cascade
);

create index if not exists idx_listening_response_sessions_campaign
  on public.listening_response_sessions(campaign_id, status, created_at desc);

create unique index if not exists idx_listening_response_sessions_token
  on public.listening_response_sessions(session_token_hash)
  where session_token_hash is not null;

create table if not exists public.listening_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  campaign_id uuid not null,
  session_id uuid not null,
  instrument_version_id uuid not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'voided')),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint listening_responses_org_id_unique unique (organization_id, id),
  constraint listening_responses_session_unique unique (session_id),
  constraint listening_responses_campaign_org_fk
    foreign key (organization_id, campaign_id)
    references public.listening_campaigns(organization_id, id)
    on delete cascade,
  constraint listening_responses_session_org_fk
    foreign key (organization_id, session_id)
    references public.listening_response_sessions(organization_id, id)
    on delete cascade,
  constraint listening_responses_version_org_fk
    foreign key (organization_id, instrument_version_id)
    references public.listening_instrument_versions(organization_id, id)
    on delete restrict
);

create index if not exists idx_listening_responses_campaign
  on public.listening_responses(campaign_id, submitted_at desc);

create table if not exists public.listening_answers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  response_id uuid not null,
  question_id uuid not null,
  question_type text not null,
  -- Typed value envelope: {option_key}|{option_keys}|{number}|{text}|{boolean}|{rank_order}
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint listening_answers_response_question_unique unique (response_id, question_id),
  constraint listening_answers_response_org_fk
    foreign key (organization_id, response_id)
    references public.listening_responses(organization_id, id)
    on delete cascade,
  constraint listening_answers_question_org_fk
    foreign key (organization_id, question_id)
    references public.listening_questions(organization_id, id)
    on delete restrict
);

create index if not exists idx_listening_answers_response
  on public.listening_answers(response_id);

create index if not exists idx_listening_answers_question
  on public.listening_answers(question_id);

-- Minimal analysis foundation (no AI engine) — avoids immediate follow-on migration
create table if not exists public.listening_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  campaign_id uuid not null,
  run_kind text not null default 'deterministic'
    check (run_kind in ('deterministic', 'ai_qualitative', 'mixed')),
  status text not null default 'pending'
    check (status in ('pending', 'running', 'succeeded', 'failed', 'cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  error_summary text,
  metadata jsonb not null default '{}'::jsonb,
  constraint listening_analysis_runs_campaign_org_fk
    foreign key (organization_id, campaign_id)
    references public.listening_campaigns(organization_id, id)
    on delete cascade
);

create index if not exists idx_listening_analysis_runs_campaign
  on public.listening_analysis_runs(campaign_id, created_at desc);

create table if not exists public.listening_signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  campaign_id uuid not null,
  analysis_run_id uuid references public.listening_analysis_runs(id) on delete set null,
  signal_kind text not null
    check (signal_kind in ('deterministic', 'ai_inferred', 'human_curated')),
  signal_type text not null default 'priority'
    check (signal_type in ('priority', 'theme', 'tension', 'opportunity', 'other')),
  title text not null,
  summary text not null default '',
  status text not null default 'proposed'
    check (status in ('proposed', 'accepted', 'rejected')),
  confidence numeric(5, 4),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint listening_signals_campaign_org_fk
    foreign key (organization_id, campaign_id)
    references public.listening_campaigns(organization_id, id)
    on delete cascade
);

create index if not exists idx_listening_signals_campaign_status
  on public.listening_signals(campaign_id, status, created_at desc);

create table if not exists public.listening_evidence_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  signal_id uuid not null,
  evidence_kind text not null
    check (evidence_kind in (
      'answer', 'aggregate', 'question', 'campaign', 'excerpt', 'other'
    )),
  answer_id uuid,
  question_id uuid,
  response_id uuid,
  label text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint listening_evidence_links_signal_fk
    foreign key (signal_id)
    references public.listening_signals(id)
    on delete cascade
);

create index if not exists idx_listening_evidence_links_signal
  on public.listening_evidence_links(signal_id);

-- ---------------------------------------------------------------------------
-- 2) Immutability: block question/option mutations on published versions
--    once the version is published (or has responses).
-- ---------------------------------------------------------------------------

create or replace function public.listening_instrument_version_is_locked(p_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.listening_instrument_versions v
    where v.id = p_version_id
      and (
        v.status = 'published'
        or v.status = 'retired'
        or exists (
          select 1
          from public.listening_responses r
          where r.instrument_version_id = v.id
        )
      )
  );
$$;

create or replace function public.listening_prevent_locked_question_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.listening_instrument_version_is_locked(
    coalesce(NEW.instrument_version_id, OLD.instrument_version_id)
  ) then
    raise exception 'listening_instrument_version_locked'
      using errcode = 'check_violation';
  end if;
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_listening_questions_immutable on public.listening_questions;
create trigger trg_listening_questions_immutable
  before update or delete on public.listening_questions
  for each row execute function public.listening_prevent_locked_question_mutation();

create or replace function public.listening_prevent_locked_option_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version_id uuid;
begin
  select q.instrument_version_id into v_version_id
  from public.listening_questions q
  where q.id = coalesce(NEW.question_id, OLD.question_id);

  if v_version_id is not null
     and public.listening_instrument_version_is_locked(v_version_id) then
    raise exception 'listening_instrument_version_locked'
      using errcode = 'check_violation';
  end if;
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_listening_options_immutable on public.listening_question_options;
create trigger trg_listening_options_immutable
  before update or delete on public.listening_question_options
  for each row execute function public.listening_prevent_locked_option_mutation();

-- Prevent demoting published → draft
create or replace function public.listening_prevent_unpublish_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.status in ('published', 'retired')
     and NEW.status = 'draft' then
    raise exception 'listening_version_cannot_unpublish'
      using errcode = 'check_violation';
  end if;
  if NEW.status = 'published' and NEW.published_at is null then
    NEW.published_at := now();
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_listening_version_publish on public.listening_instrument_versions;
create trigger trg_listening_version_publish
  before update on public.listening_instrument_versions
  for each row execute function public.listening_prevent_unpublish_version();

-- ---------------------------------------------------------------------------
-- 3) Token helpers
-- ---------------------------------------------------------------------------

create or replace function public.listening_token_digest(p_token text)
returns bytea
language sql
immutable
set search_path = public
as $$
  select digest(convert_to(p_token, 'UTF8'), 'sha256');
$$;

-- ---------------------------------------------------------------------------
-- 4) Public RPCs (SECURITY DEFINER, fail-closed)
-- ---------------------------------------------------------------------------

create or replace function public.resolve_public_listening_campaign(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash bytea;
  v_campaign public.listening_campaigns%rowtype;
  v_questions jsonb;
begin
  if p_token is null or length(trim(p_token)) < 16 then
    raise exception 'listening_token_invalid' using errcode = 'invalid_parameter_value';
  end if;

  v_hash := public.listening_token_digest(trim(p_token));

  select * into v_campaign
  from public.listening_campaigns c
  where c.public_token_hash = v_hash
  limit 1;

  if not found then
    raise exception 'listening_token_invalid' using errcode = 'invalid_parameter_value';
  end if;

  if v_campaign.status <> 'open' then
    raise exception 'listening_campaign_not_open' using errcode = 'check_violation';
  end if;

  if v_campaign.opens_at is not null and v_campaign.opens_at > now() then
    raise exception 'listening_campaign_not_open' using errcode = 'check_violation';
  end if;

  if v_campaign.closes_at is not null and v_campaign.closes_at <= now() then
    raise exception 'listening_campaign_not_open' using errcode = 'check_violation';
  end if;

  -- Require published instrument version
  if not exists (
    select 1
    from public.listening_instrument_versions v
    where v.id = v_campaign.instrument_version_id
      and v.organization_id = v_campaign.organization_id
      and v.status = 'published'
  ) then
    raise exception 'listening_campaign_not_open' using errcode = 'check_violation';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'question_key', q.question_key,
      'question_type', q.question_type,
      'prompt', q.prompt,
      'help_text', q.help_text,
      'required', q.required,
      'display_order', q.display_order,
      'config', q.config,
      'options', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', o.id,
            'option_key', o.option_key,
            'label', o.label,
            'display_order', o.display_order,
            'value_numeric', o.value_numeric
          )
          order by o.display_order, o.option_key
        )
        from public.listening_question_options o
        where o.question_id = q.id
          and o.organization_id = q.organization_id
      ), '[]'::jsonb)
    )
    order by q.display_order, q.question_key
  ), '[]'::jsonb)
  into v_questions
  from public.listening_questions q
  where q.instrument_version_id = v_campaign.instrument_version_id
    and q.organization_id = v_campaign.organization_id;

  -- Intentionally omit organization_id, token hash, internal permissions, results
  return jsonb_build_object(
    'campaign_id', v_campaign.id,
    'title', v_campaign.title,
    'introduction', v_campaign.introduction,
    'privacy_statement', v_campaign.privacy_statement,
    'privacy_mode', v_campaign.privacy_mode,
    'instrument_version_id', v_campaign.instrument_version_id,
    'questions', v_questions
  );
end;
$$;

create or replace function public.submit_listening_response(
  p_token text,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash bytea;
  v_campaign public.listening_campaigns%rowtype;
  v_session_id uuid;
  v_response_id uuid;
  v_answer jsonb;
  v_question public.listening_questions%rowtype;
  v_qid uuid;
  v_type text;
  v_value jsonb;
  v_required_missing boolean;
  v_option_key text;
  v_option_keys jsonb;
  v_uid uuid := auth.uid();
begin
  if p_token is null or length(trim(p_token)) < 16 then
    raise exception 'listening_token_invalid' using errcode = 'invalid_parameter_value';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'listening_answers_invalid' using errcode = 'invalid_parameter_value';
  end if;

  v_hash := public.listening_token_digest(trim(p_token));

  select * into v_campaign
  from public.listening_campaigns c
  where c.public_token_hash = v_hash
  for update;

  if not found then
    raise exception 'listening_token_invalid' using errcode = 'invalid_parameter_value';
  end if;

  if v_campaign.status <> 'open'
     or (v_campaign.opens_at is not null and v_campaign.opens_at > now())
     or (v_campaign.closes_at is not null and v_campaign.closes_at <= now()) then
    raise exception 'listening_campaign_not_open' using errcode = 'check_violation';
  end if;

  if not exists (
    select 1 from public.listening_instrument_versions v
    where v.id = v_campaign.instrument_version_id
      and v.organization_id = v_campaign.organization_id
      and v.status = 'published'
  ) then
    raise exception 'listening_campaign_not_open' using errcode = 'check_violation';
  end if;

  -- Create session (anonymous by default; confidential/identified may bind uid)
  insert into public.listening_response_sessions (
    organization_id,
    campaign_id,
    status,
    respondent_user_id,
    submitted_at
  ) values (
    v_campaign.organization_id,
    v_campaign.id,
    'submitted',
    case
      when v_campaign.privacy_mode = 'anonymous' then null
      when v_campaign.privacy_mode in ('confidential', 'identified') then v_uid
      else null
    end,
    now()
  )
  returning id into v_session_id;

  insert into public.listening_responses (
    organization_id,
    campaign_id,
    session_id,
    instrument_version_id,
    status,
    submitted_at
  ) values (
    v_campaign.organization_id,
    v_campaign.id,
    v_session_id,
    v_campaign.instrument_version_id,
    'submitted',
    now()
  )
  returning id into v_response_id;

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    begin
      v_qid := (v_answer->>'question_id')::uuid;
    exception when others then
      raise exception 'listening_answers_invalid' using errcode = 'invalid_parameter_value';
    end;

    select * into v_question
    from public.listening_questions q
    where q.id = v_qid
      and q.organization_id = v_campaign.organization_id
      and q.instrument_version_id = v_campaign.instrument_version_id;

    if not found then
      raise exception 'listening_foreign_question' using errcode = 'foreign_key_violation';
    end if;

    v_type := v_question.question_type;
    v_value := coalesce(v_answer->'value', '{}'::jsonb);

    -- Type validation (V1 subset + forward-compatible checks)
    if v_type in ('single_choice', 'yes_no') then
      v_option_key := v_value->>'option_key';
      if v_option_key is null or not exists (
        select 1 from public.listening_question_options o
        where o.question_id = v_question.id
          and o.organization_id = v_campaign.organization_id
          and o.option_key = v_option_key
      ) then
        -- yes_no may use boolean without options
        if v_type = 'yes_no' and (v_value ? 'boolean') then
          null;
        else
          raise exception 'listening_foreign_option' using errcode = 'foreign_key_violation';
        end if;
      end if;
    elsif v_type = 'multi_choice' then
      v_option_keys := v_value->'option_keys';
      if jsonb_typeof(v_option_keys) <> 'array' then
        raise exception 'listening_answers_invalid' using errcode = 'invalid_parameter_value';
      end if;
      if exists (
        select 1
        from jsonb_array_elements_text(v_option_keys) ok(option_key)
        where not exists (
          select 1 from public.listening_question_options o
          where o.question_id = v_question.id
            and o.organization_id = v_campaign.organization_id
            and o.option_key = ok.option_key
        )
      ) then
        raise exception 'listening_foreign_option' using errcode = 'foreign_key_violation';
      end if;
    elsif v_type in ('likert', 'numeric', 'nps') then
      if not (v_value ? 'number') then
        raise exception 'listening_answers_invalid' using errcode = 'invalid_parameter_value';
      end if;
    elsif v_type in ('short_text', 'long_text') then
      if not (v_value ? 'text') then
        raise exception 'listening_answers_invalid' using errcode = 'invalid_parameter_value';
      end if;
    elsif v_type = 'ranking' then
      if jsonb_typeof(v_value->'rank_order') <> 'array' then
        raise exception 'listening_answers_invalid' using errcode = 'invalid_parameter_value';
      end if;
    end if;

    insert into public.listening_answers (
      organization_id,
      response_id,
      question_id,
      question_type,
      value
    ) values (
      v_campaign.organization_id,
      v_response_id,
      v_question.id,
      v_type,
      v_value
    );
  end loop;

  -- Required questions must be answered
  select exists (
    select 1
    from public.listening_questions q
    where q.instrument_version_id = v_campaign.instrument_version_id
      and q.organization_id = v_campaign.organization_id
      and q.required = true
      and not exists (
        select 1 from public.listening_answers a
        where a.response_id = v_response_id
          and a.question_id = q.id
      )
  ) into v_required_missing;

  if v_required_missing then
    raise exception 'listening_required_missing' using errcode = 'check_violation';
  end if;

  -- Client cannot redirect organization: organization_id only from campaign
  return jsonb_build_object(
    'ok', true,
    'response_id', v_response_id,
    'submitted_at', now()
  );
end;
$$;

revoke all on function public.resolve_public_listening_campaign(text) from public;
revoke all on function public.submit_listening_response(text, jsonb) from public;
revoke all on function public.listening_token_digest(text) from public;
revoke all on function public.listening_instrument_version_is_locked(uuid) from public;

grant execute on function public.resolve_public_listening_campaign(text)
  to anon, authenticated, service_role;
grant execute on function public.submit_listening_response(text, jsonb)
  to anon, authenticated, service_role;

-- Digest helper: service/authenticated only (not for anon probing)
grant execute on function public.listening_token_digest(text)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5) RLS — fail closed
-- ---------------------------------------------------------------------------

alter table public.listening_initiatives enable row level security;
alter table public.listening_instruments enable row level security;
alter table public.listening_instrument_versions enable row level security;
alter table public.listening_questions enable row level security;
alter table public.listening_question_options enable row level security;
alter table public.listening_segments enable row level security;
alter table public.listening_campaigns enable row level security;
alter table public.listening_campaign_segments enable row level security;
alter table public.listening_response_sessions enable row level security;
alter table public.listening_responses enable row level security;
alter table public.listening_answers enable row level security;
alter table public.listening_analysis_runs enable row level security;
alter table public.listening_signals enable row level security;
alter table public.listening_evidence_links enable row level security;

-- Metadata / authoring: org access + LISTENING_VIEW (read) / LISTENING_MANAGE (write)
-- Stewards covered by can_access_organization via is_platform_steward.

drop policy if exists listening_initiatives_select on public.listening_initiatives;
create policy listening_initiatives_select on public.listening_initiatives
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_VIEW')
      or public.has_permission('LISTENING_MANAGE')
    )
  );

drop policy if exists listening_initiatives_write on public.listening_initiatives;
create policy listening_initiatives_write on public.listening_initiatives
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_MANAGE')
    )
  )
  with check (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_MANAGE')
    )
  );

drop policy if exists listening_instruments_select on public.listening_instruments;
create policy listening_instruments_select on public.listening_instruments
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_VIEW')
      or public.has_permission('LISTENING_MANAGE')
    )
  );

drop policy if exists listening_instruments_write on public.listening_instruments;
create policy listening_instruments_write on public.listening_instruments
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  )
  with check (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  );

drop policy if exists listening_versions_select on public.listening_instrument_versions;
create policy listening_versions_select on public.listening_instrument_versions
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_VIEW')
      or public.has_permission('LISTENING_MANAGE')
    )
  );

drop policy if exists listening_versions_write on public.listening_instrument_versions;
create policy listening_versions_write on public.listening_instrument_versions
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  )
  with check (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  );

drop policy if exists listening_questions_select on public.listening_questions;
create policy listening_questions_select on public.listening_questions
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_VIEW')
      or public.has_permission('LISTENING_MANAGE')
    )
  );

drop policy if exists listening_questions_write on public.listening_questions;
create policy listening_questions_write on public.listening_questions
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  )
  with check (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  );

drop policy if exists listening_options_select on public.listening_question_options;
create policy listening_options_select on public.listening_question_options
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_VIEW')
      or public.has_permission('LISTENING_MANAGE')
    )
  );

drop policy if exists listening_options_write on public.listening_question_options;
create policy listening_options_write on public.listening_question_options
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  )
  with check (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  );

drop policy if exists listening_segments_select on public.listening_segments;
create policy listening_segments_select on public.listening_segments
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_VIEW')
      or public.has_permission('LISTENING_MANAGE')
    )
  );

drop policy if exists listening_segments_write on public.listening_segments;
create policy listening_segments_write on public.listening_segments
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  )
  with check (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  );

-- Campaigns: SELECT hides public_token_hash from clients via column privileges below
drop policy if exists listening_campaigns_select on public.listening_campaigns;
create policy listening_campaigns_select on public.listening_campaigns
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_VIEW')
      or public.has_permission('LISTENING_MANAGE')
    )
  );

drop policy if exists listening_campaigns_write on public.listening_campaigns;
create policy listening_campaigns_write on public.listening_campaigns
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  )
  with check (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  );

drop policy if exists listening_campaign_segments_all on public.listening_campaign_segments;
create policy listening_campaign_segments_all on public.listening_campaign_segments
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_VIEW')
      or public.has_permission('LISTENING_MANAGE')
    )
  )
  with check (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  );

-- RAW responses / answers / sessions: LISTENING_RAW required (+ org scope)
drop policy if exists listening_sessions_raw on public.listening_response_sessions;
create policy listening_sessions_raw on public.listening_response_sessions
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_RAW')
    )
  );

drop policy if exists listening_sessions_manage on public.listening_response_sessions;
create policy listening_sessions_manage on public.listening_response_sessions
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  )
  with check (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  );

drop policy if exists listening_responses_raw on public.listening_responses;
create policy listening_responses_raw on public.listening_responses
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_RAW')
    )
  );

drop policy if exists listening_responses_manage on public.listening_responses;
create policy listening_responses_manage on public.listening_responses
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  )
  with check (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  );

drop policy if exists listening_answers_raw on public.listening_answers;
create policy listening_answers_raw on public.listening_answers
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_RAW')
    )
  );

drop policy if exists listening_answers_manage on public.listening_answers;
create policy listening_answers_manage on public.listening_answers
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  )
  with check (
    public.can_access_organization(organization_id)
    and (public.is_platform_steward() or public.has_permission('LISTENING_MANAGE'))
  );

drop policy if exists listening_analysis_select on public.listening_analysis_runs;
create policy listening_analysis_select on public.listening_analysis_runs
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_VIEW')
      or public.has_permission('LISTENING_ANALYZE')
    )
  );

drop policy if exists listening_analysis_write on public.listening_analysis_runs;
create policy listening_analysis_write on public.listening_analysis_runs
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_ANALYZE')
      or public.has_permission('LISTENING_MANAGE')
    )
  )
  with check (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_ANALYZE')
      or public.has_permission('LISTENING_MANAGE')
    )
  );

drop policy if exists listening_signals_select on public.listening_signals;
create policy listening_signals_select on public.listening_signals
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_VIEW')
      or public.has_permission('LISTENING_ANALYZE')
    )
  );

drop policy if exists listening_signals_write on public.listening_signals;
create policy listening_signals_write on public.listening_signals
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_ANALYZE')
      or public.has_permission('LISTENING_MANAGE')
    )
  )
  with check (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_ANALYZE')
      or public.has_permission('LISTENING_MANAGE')
    )
  );

drop policy if exists listening_evidence_select on public.listening_evidence_links;
create policy listening_evidence_select on public.listening_evidence_links
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_VIEW')
      or public.has_permission('LISTENING_ANALYZE')
      or public.has_permission('LISTENING_RAW')
    )
  );

drop policy if exists listening_evidence_write on public.listening_evidence_links;
create policy listening_evidence_write on public.listening_evidence_links
  for all to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_ANALYZE')
      or public.has_permission('LISTENING_MANAGE')
    )
  )
  with check (
    public.can_access_organization(organization_id)
    and (
      public.is_platform_steward()
      or public.has_permission('LISTENING_ANALYZE')
      or public.has_permission('LISTENING_MANAGE')
    )
  );

-- ---------------------------------------------------------------------------
-- 6) Grants — NO anon table privileges; token hash not grantable to authenticated
-- ---------------------------------------------------------------------------

revoke all on table public.listening_initiatives from anon, public;
revoke all on table public.listening_instruments from anon, public;
revoke all on table public.listening_instrument_versions from anon, public;
revoke all on table public.listening_questions from anon, public;
revoke all on table public.listening_question_options from anon, public;
revoke all on table public.listening_segments from anon, public;
revoke all on table public.listening_campaigns from anon, public;
revoke all on table public.listening_campaign_segments from anon, public;
revoke all on table public.listening_response_sessions from anon, public;
revoke all on table public.listening_responses from anon, public;
revoke all on table public.listening_answers from anon, public;
revoke all on table public.listening_analysis_runs from anon, public;
revoke all on table public.listening_signals from anon, public;
revoke all on table public.listening_evidence_links from anon, public;

grant select, insert, update, delete on public.listening_initiatives to authenticated;
grant select, insert, update, delete on public.listening_instruments to authenticated;
grant select, insert, update, delete on public.listening_instrument_versions to authenticated;
grant select, insert, update, delete on public.listening_questions to authenticated;
grant select, insert, update, delete on public.listening_question_options to authenticated;
grant select, insert, update, delete on public.listening_segments to authenticated;
grant select, insert, update, delete on public.listening_campaign_segments to authenticated;
grant select, insert, update, delete on public.listening_analysis_runs to authenticated;
grant select, insert, update, delete on public.listening_signals to authenticated;
grant select, insert, update, delete on public.listening_evidence_links to authenticated;

-- Campaigns: grant column-level SELECT excluding public_token_hash
grant select (
  id, organization_id, initiative_id, instrument_version_id, title, introduction,
  privacy_statement, status, privacy_mode, opens_at, closes_at, created_by,
  created_at, updated_at, archived_at, metadata, min_cohort_size
) on public.listening_campaigns to authenticated;
grant insert, update, delete on public.listening_campaigns to authenticated;
-- Allow managers to set token hash via UPDATE/INSERT (RLS still applies)
grant update (public_token_hash) on public.listening_campaigns to authenticated;
grant insert (public_token_hash) on public.listening_campaigns to authenticated;

grant select, insert, update, delete on public.listening_response_sessions to authenticated;
grant select, insert, update, delete on public.listening_responses to authenticated;
grant select, insert, update, delete on public.listening_answers to authenticated;

-- service_role retains full access (bypasses RLS) for admin/cron only in app architecture
grant all on table public.listening_initiatives to service_role;
grant all on table public.listening_instruments to service_role;
grant all on table public.listening_instrument_versions to service_role;
grant all on table public.listening_questions to service_role;
grant all on table public.listening_question_options to service_role;
grant all on table public.listening_segments to service_role;
grant all on table public.listening_campaigns to service_role;
grant all on table public.listening_campaign_segments to service_role;
grant all on table public.listening_response_sessions to service_role;
grant all on table public.listening_responses to service_role;
grant all on table public.listening_answers to service_role;
grant all on table public.listening_analysis_runs to service_role;
grant all on table public.listening_signals to service_role;
grant all on table public.listening_evidence_links to service_role;

notify pgrst, 'reload schema';

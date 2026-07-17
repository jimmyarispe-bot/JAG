-- Sprint 014 — Identity & Access Foundation
-- Platform IAM tables: delegation, break glass, immutable audit.
-- Product-agnostic — no AcademyOS / application-specific objects.

-- ---------------------------------------------------------------------------
-- Delegations (temporary authority)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.iam_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grantor_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  grantee_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  organization_id uuid NULL,
  permission_keys text[] NOT NULL DEFAULT '{}',
  reason text NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT iam_delegations_expiry_check CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS iam_delegations_grantee_active_idx
  ON public.iam_delegations (grantee_user_id, status, expires_at);

CREATE INDEX IF NOT EXISTS iam_delegations_org_idx
  ON public.iam_delegations (organization_id);

COMMENT ON TABLE public.iam_delegations IS
  'Sprint 014 — Temporary delegated authority with expiration and revocation.';

-- ---------------------------------------------------------------------------
-- Break glass sessions (emergency access)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.iam_break_glass_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  approver_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  organization_id uuid NOT NULL,
  permission_keys text[] NOT NULL DEFAULT '{}',
  reason text NOT NULL,
  ticket_ref text NULL,
  status text NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN (
      'pending_approval',
      'approved',
      'denied',
      'active',
      'expired',
      'revoked'
    )),
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz NULL,
  activated_at timestamptz NULL,
  expires_at timestamptz NULL,
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS iam_break_glass_requester_active_idx
  ON public.iam_break_glass_sessions (requester_user_id, status, expires_at);

CREATE INDEX IF NOT EXISTS iam_break_glass_org_idx
  ON public.iam_break_glass_sessions (organization_id);

COMMENT ON TABLE public.iam_break_glass_sessions IS
  'Sprint 014 — Emergency access sessions with approval workflow and auto-expiry.';

-- ---------------------------------------------------------------------------
-- IAM audit events (append-oriented; break_glass rows treated as immutable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.iam_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  actor_user_id uuid NULL,
  subject_user_id uuid NULL,
  organization_id uuid NULL,
  permission text NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  immutable boolean NOT NULL DEFAULT false,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS iam_audit_events_at_idx
  ON public.iam_audit_events (at DESC);

CREATE INDEX IF NOT EXISTS iam_audit_events_kind_idx
  ON public.iam_audit_events (kind);

CREATE INDEX IF NOT EXISTS iam_audit_events_org_idx
  ON public.iam_audit_events (organization_id);

COMMENT ON TABLE public.iam_audit_events IS
  'Sprint 014 — IAM audit stream. immutable=true rows must not be updated or deleted.';

-- Prevent UPDATE/DELETE on immutable audit rows
CREATE OR REPLACE FUNCTION public.iam_audit_reject_immutable_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.immutable THEN
    RAISE EXCEPTION 'Immutable IAM audit event cannot be updated: %', OLD.id;
  END IF;
  IF TG_OP = 'DELETE' AND OLD.immutable THEN
    RAISE EXCEPTION 'Immutable IAM audit event cannot be deleted: %', OLD.id;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS iam_audit_events_immutable_guard ON public.iam_audit_events;
CREATE TRIGGER iam_audit_events_immutable_guard
  BEFORE UPDATE OR DELETE ON public.iam_audit_events
  FOR EACH ROW
  EXECUTE FUNCTION public.iam_audit_reject_immutable_mutation();

-- Seed core IAM permission keys into platform_permissions when present
INSERT INTO public.platform_permissions (permission_key, name, description, module, category, sort_order)
SELECT v.permission_key, v.name, v.description, v.module, v.category, v.sort_order
FROM (
  VALUES
    ('iam.admin', 'IAM Administration', 'Manage IAM roles and settings', 'iam', 'platform', 200),
    ('iam.audit.read', 'IAM Audit Read', 'View IAM audit events', 'iam', 'platform', 210),
    ('iam.delegation.grant', 'Grant Delegation', 'Grant temporary delegated authority', 'iam', 'platform', 220),
    ('iam.delegation.revoke', 'Revoke Delegation', 'Revoke temporary delegated authority', 'iam', 'platform', 230),
    ('iam.break_glass.request', 'Request Break Glass', 'Request emergency access', 'iam', 'platform', 240),
    ('iam.break_glass.approve', 'Approve Break Glass', 'Approve emergency access', 'iam', 'platform', 250)
) AS v(permission_key, name, description, module, category, sort_order)
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'platform_permissions'
)
ON CONFLICT (permission_key) DO NOTHING;

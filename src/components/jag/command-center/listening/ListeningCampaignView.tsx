"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { JagSection } from "@/components/jag/command-center";
import { regenerateCampaignTokenAction } from "@/lib/jag-command-center/listening/actions";
import { ListeningBanner } from "./ListeningBanner";
import { ListeningBreadcrumbs } from "./ListeningBreadcrumbs";
import { ListeningStatusPill } from "./ListeningStatusPill";

const TOKEN_STORAGE_PREFIX = "listening.campaign.public.";

export function ListeningCampaignView({
  organizationId,
  canManage,
  campaign,
  responseCount = 0,
}: {
  readonly organizationId: string;
  readonly canManage: boolean;
  readonly campaign: Record<string, unknown>;
  readonly responseCount?: number;
}) {
  const id = String(campaign.id);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [copied, setCopied] = useState<"url" | "token" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`${TOKEN_STORAGE_PREFIX}${id}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { url?: string; token?: string };
      if (parsed.url) {
        const full =
          typeof window !== "undefined"
            ? `${window.location.origin}${parsed.url}`
            : parsed.url;
        setPublicUrl(full);
      }
      if (parsed.token) setPublicToken(parsed.token);
    } catch {
      /* ignore */
    }
  }, [id]);

  function storeSecrets(token: string, url: string) {
    const full =
      typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
    setPublicToken(token);
    setPublicUrl(full);
    try {
      sessionStorage.setItem(
        `${TOKEN_STORAGE_PREFIX}${id}`,
        JSON.stringify({ token, url })
      );
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <ListeningBreadcrumbs
          items={[
            { label: "Listening", href: "/jag/listening" },
            {
              label: "Initiative",
              href: `/jag/listening/initiatives/${String(campaign.initiative_id)}`,
            },
            { label: String(campaign.title) },
          ]}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-medium text-[var(--jag-text)]">
            {String(campaign.title)}
          </h1>
          <ListeningStatusPill label={String(campaign.status)} />
        </div>
      </div>

      {message ? (
        <ListeningBanner tone="success" onDismiss={() => setMessage(null)}>
          {message}
        </ListeningBanner>
      ) : null}

      <JagSection title="Campaign details">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[var(--jag-muted)]">Status</dt>
            <dd className="text-[var(--jag-text)]">{String(campaign.status)}</dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Privacy</dt>
            <dd className="text-[var(--jag-text)]">
              {String(campaign.privacy_mode)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Open date</dt>
            <dd className="text-[var(--jag-text)]">
              {campaign.opens_at ? String(campaign.opens_at) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Close date</dt>
            <dd className="text-[var(--jag-text)]">
              {campaign.closes_at ? String(campaign.closes_at) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Instrument version</dt>
            <dd>
              <Link
                href={`/jag/listening/versions/${String(campaign.instrument_version_id)}`}
                className="text-[var(--jag-accent)] hover:underline"
              >
                Open version
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Responses</dt>
            <dd className="text-[var(--jag-text)]" data-testid="listening-response-count">
              {responseCount}
              {responseCount === 0 ? (
                <span className="ml-2 text-xs text-[var(--jag-muted-2)]">
                  (collection UI ships next)
                </span>
              ) : null}
            </dd>
          </div>
        </dl>
      </JagSection>

      <JagSection
        title="Public listening link"
        description="Plaintext tokens are available only at create or regenerate. Hash is stored server-side."
      >
        {publicUrl ? (
          <div className="space-y-3" data-testid="listening-public-link">
            <div>
              <p className="text-xs text-[var(--jag-muted)]">Public URL</p>
              <p className="mt-1 break-all font-[family-name:var(--font-jag-mono)] text-xs text-[var(--jag-text)]">
                {publicUrl}
              </p>
              <button
                type="button"
                className="mt-2 text-sm text-[var(--jag-accent)]"
                onClick={() => {
                  void navigator.clipboard.writeText(publicUrl).then(() => {
                    setCopied("url");
                  });
                }}
              >
                {copied === "url" ? "Copied URL" : "Copy URL"}
              </button>
            </div>
            {publicToken ? (
              <div>
                <p className="text-xs text-[var(--jag-muted)]">Token</p>
                <p className="mt-1 break-all font-[family-name:var(--font-jag-mono)] text-xs text-[var(--jag-text)]">
                  {publicToken}
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm text-[var(--jag-accent)]"
                  onClick={() => {
                    void navigator.clipboard.writeText(publicToken).then(() => {
                      setCopied("token");
                    });
                  }}
                >
                  {copied === "token" ? "Copied token" : "Copy token"}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[var(--jag-muted)]">
            No plaintext token in this session. Regenerate to mint a new public
            link (invalidates the previous one).
          </p>
        )}

        {canManage ? (
          <form
            className="mt-4"
            action={(fd) => {
              start(async () => {
                const result = await regenerateCampaignTokenAction(fd);
                if (!result.ok) {
                  setMessage(result.error);
                  return;
                }
                if (result.publicToken && result.publicUrl) {
                  storeSecrets(result.publicToken, result.publicUrl);
                  setMessage(
                    "Token regenerated. Copy the new link now — previous links stop working."
                  );
                }
              });
            }}
          >
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="campaignId" value={id} />
            <button
              type="submit"
              disabled={pending}
              data-testid="listening-regenerate-token"
              className="rounded-md border border-[var(--jag-border)] px-3 py-1.5 text-sm disabled:opacity-50"
            >
              {pending ? "Regenerating…" : "Regenerate token"}
            </button>
          </form>
        ) : null}
      </JagSection>
    </div>
  );
}

export { TOKEN_STORAGE_PREFIX as LISTENING_CAMPAIGN_TOKEN_STORAGE_PREFIX };

import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitCommunicationsEvent } from "./events";
import {
  getTemplate,
  listTemplates,
  upsertTemplate,
} from "./store";
import type {
  CommunicationChannel,
  CommunicationDomain,
  CommunicationTemplate,
  TemplateStatus,
} from "./types";
import { COMMUNICATION_CHANNELS, COMMUNICATION_DOMAINS } from "./types";

const VAR_PATTERN = /\{\{(\w+)\}\}/g;

export function renderTemplate(
  text: string,
  vars: Readonly<Record<string, string>>
): string {
  return text.replace(VAR_PATTERN, (_, key: string) => vars[key] ?? "");
}

export function createTemplateService() {
  return {
    create(input: {
      organizationId: string;
      key: string;
      name: string;
      domain: CommunicationDomain;
      channel: CommunicationChannel;
      subject: string;
      body: string;
      status?: TemplateStatus;
      createdBy: string;
    }): CommunicationTemplate | { error: string } {
      if (!input.key.trim() || !input.name.trim()) {
        return { error: "key and name are required." };
      }
      if (!(COMMUNICATION_DOMAINS as readonly string[]).includes(input.domain)) {
        return { error: "Invalid domain." };
      }
      if (!(COMMUNICATION_CHANNELS as readonly string[]).includes(input.channel)) {
        return { error: "Invalid channel." };
      }
      const existing = listTemplates(input.organizationId).find(
        (t) => t.key === input.key.trim()
      );
      if (existing) return { error: "Template key already exists." };

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Template",
        twinEntityType: "Document",
        id,
        label: input.name.trim(),
        kind: "communication_template",
        actor: input.createdBy,
        metadata: { domain: input.domain, channel: input.channel },
      });

      const status = input.status ?? "Draft";
      const template = upsertTemplate({
        id,
        organizationId: input.organizationId,
        key: input.key.trim(),
        name: input.name.trim(),
        domain: input.domain,
        channel: input.channel,
        subject: input.subject,
        body: input.body,
        status,
        version: 1,
        versions:
          status === "Published"
            ? [
                {
                  version: 1,
                  subject: input.subject,
                  body: input.body,
                  publishedAt: now,
                  publishedBy: input.createdBy,
                },
              ]
            : [],
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Template",
        entityId: id,
        eventType: "template_created",
        actor: input.createdBy,
      });
      return template;
    },

    publish(input: {
      organizationId: string;
      templateId: string;
      actor: string;
    }): CommunicationTemplate | { error: string } | null {
      const current = getTemplate(input.organizationId, input.templateId);
      if (!current) return null;
      const now = new Date().toISOString();
      const nextVersion =
        current.status === "Published" ? current.version + 1 : current.version;
      const updated = upsertTemplate({
        ...current,
        status: "Published",
        version: nextVersion,
        versions: [
          ...current.versions,
          {
            version: nextVersion,
            subject: current.subject,
            body: current.body,
            publishedAt: now,
            publishedBy: input.actor,
          },
        ],
        updatedAt: now,
      });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Template",
        entityId: current.id,
        eventType: "template_published",
        actor: input.actor,
        metadata: { version: String(nextVersion) },
      });
      return updated;
    },

    patch(input: {
      organizationId: string;
      templateId: string;
      subject?: string;
      body?: string;
      name?: string;
      actor: string;
    }): CommunicationTemplate | { error: string } | null {
      const current = getTemplate(input.organizationId, input.templateId);
      if (!current) return null;
      const updated = upsertTemplate({
        ...current,
        name: input.name?.trim() || current.name,
        subject: input.subject ?? current.subject,
        body: input.body ?? current.body,
        status: "Draft",
        updatedAt: new Date().toISOString(),
      });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Template",
        entityId: current.id,
        eventType: "template_updated",
        actor: input.actor,
      });
      return updated;
    },

    render(input: {
      organizationId: string;
      templateId: string;
      variables: Readonly<Record<string, string>>;
    }): { subject: string; body: string } | { error: string } | null {
      const template = getTemplate(input.organizationId, input.templateId);
      if (!template) return null;
      if (template.status !== "Published") {
        return { error: "Template must be published before rendering." };
      }
      return {
        subject: renderTemplate(template.subject, input.variables),
        body: renderTemplate(template.body, input.variables),
      };
    },

    get: getTemplate,
    list: listTemplates,

    search(input: {
      organizationId: string;
      q?: string;
      domain?: CommunicationDomain;
      status?: TemplateStatus;
    }) {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        listTemplates(input.organizationId).filter((t) => {
          if (input.domain && t.domain !== input.domain) return false;
          if (input.status && t.status !== input.status) return false;
          if (!q) return true;
          return (
            t.name.toLowerCase().includes(q) ||
            t.key.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q)
          );
        })
      );
    },
  };
}

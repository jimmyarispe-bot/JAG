/**
 * Transport boundary for OpenAI chat completions.
 * Official SDK is optional — inject any client that satisfies this shape.
 */

import { OpenAIProviderError } from "@/jag/reference-providers/openai/errors";

export type OpenAIChatMessage = {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
};

export type OpenAIChatCompletionParams = {
  readonly model: string;
  readonly messages: readonly OpenAIChatMessage[];
  readonly temperature?: number;
  /** Prefer JSON object mode when supported. */
  readonly jsonObjectMode?: boolean;
};

export type OpenAIChatCompletionResult = {
  readonly content: string;
  readonly model?: string;
  readonly finishReason?: string;
  readonly usage?: {
    readonly promptTokens?: number;
    readonly completionTokens?: number;
  };
};

export type OpenAIChatClient = {
  complete(
    params: OpenAIChatCompletionParams
  ): Promise<OpenAIChatCompletionResult>;
};

export type OpenAIFetchClientOptions = {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
};

/**
 * Minimal HTTPS client for Chat Completions. No official SDK dependency.
 */
export function createOpenAIFetchClient(
  options: OpenAIFetchClientOptions
): OpenAIChatClient {
  if (!options.apiKey) {
    throw new OpenAIProviderError("config", "OpenAI apiKey is required");
  }
  const baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(
    /\/$/,
    ""
  );
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 30_000;

  return {
    async complete(params) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const body: Record<string, unknown> = {
          model: params.model,
          messages: params.messages,
          temperature: params.temperature ?? 0,
        };
        if (params.jsonObjectMode !== false) {
          body.response_format = { type: "json_object" };
        }

        const response = await fetchImpl(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (response.status === 401 || response.status === 403) {
          throw new OpenAIProviderError(
            "auth",
            `OpenAI auth failed (${response.status})`,
            { status: response.status }
          );
        }
        if (response.status === 429) {
          throw new OpenAIProviderError(
            "rate_limit",
            "OpenAI rate limit exceeded",
            { status: 429, retryable: true }
          );
        }
        if (response.status >= 500) {
          throw new OpenAIProviderError(
            "network",
            `OpenAI server error (${response.status})`,
            { status: response.status, retryable: true }
          );
        }
        if (!response.ok) {
          throw new OpenAIProviderError(
            "unknown",
            `OpenAI request failed (${response.status})`,
            { status: response.status }
          );
        }

        const json = (await response.json()) as {
          choices?: { message?: { content?: string }; finish_reason?: string }[];
          model?: string;
          usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
          };
        };
        const content = json.choices?.[0]?.message?.content;
        if (typeof content !== "string" || content.length === 0) {
          throw new OpenAIProviderError(
            "invalid_response",
            "OpenAI response missing message content"
          );
        }
        return {
          content,
          model: json.model,
          finishReason: json.choices?.[0]?.finish_reason,
          usage: {
            promptTokens: json.usage?.prompt_tokens,
            completionTokens: json.usage?.completion_tokens,
          },
        };
      } catch (error) {
        if (error instanceof OpenAIProviderError) throw error;
        if (
          error instanceof Error &&
          (error.name === "AbortError" || error.message.includes("abort"))
        ) {
          throw new OpenAIProviderError("timeout", "OpenAI request timed out", {
            retryable: true,
            cause: error,
          });
        }
        throw new OpenAIProviderError("network", "OpenAI network failure", {
          retryable: true,
          cause: error,
        });
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

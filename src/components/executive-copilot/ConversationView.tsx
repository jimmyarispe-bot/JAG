"use client";

import type { CopilotMessage } from "@/lib/platform/intelligence/executive-copilot";
import { cn } from "@/components/workspace-design-system/utils";

export interface ConversationViewProps {
  messages: CopilotMessage[];
  className?: string;
}

export function ConversationView({ messages, className }: ConversationViewProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {messages.map((m) => (
        <div
          key={m.id}
          className={cn(
            "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
            m.role === "user"
              ? "ml-auto bg-brand-600 text-white"
              : m.role === "assistant"
                ? "mr-auto border border-slate-200 bg-white text-slate-800"
                : "mx-auto text-xs text-slate-500"
          )}
        >
          {m.content}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ListeningActionResult } from "@/lib/jag-command-center/listening/actions";

export function ListeningFormButton({
  action,
  children,
  className,
  onSuccess,
}: {
  readonly action: (formData: FormData) => Promise<ListeningActionResult>;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly onSuccess?: (result: Extract<ListeningActionResult, { ok: true }>) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "rounded-md bg-[var(--jag-accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      }
      formAction={(fd) => {
        start(async () => {
          const result = await action(fd);
          if (!result.ok) {
            window.alert(result.error);
            return;
          }
          onSuccess?.(result);
          router.refresh();
        });
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}

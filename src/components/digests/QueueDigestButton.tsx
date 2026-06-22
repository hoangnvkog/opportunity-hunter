"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { queueDigestNowAction } from "@/actions/weekly-digest.actions";

interface QueueDigestButtonProps {
  className?: string;
}

export function QueueDigestButton({ className }: QueueDigestButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function trigger() {
    setMessage(null);
    startTransition(async () => {
      const result = await queueDigestNowAction();
      if (result.ok) {
        setMessage("Queued ✓ — check back in a moment.");
        router.refresh();
      } else {
        setMessage(result.reason ?? "Failed to queue digest.");
      }
    });
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={trigger}
        disabled={pending}
        className="inline-flex items-center rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Queueing…" : "Generate digest now"}
      </button>
      {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

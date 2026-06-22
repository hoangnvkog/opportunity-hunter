"use client";

import { useState, useTransition } from "react";
import { updateNotificationSettingsAction } from "@/actions/weekly-digest.actions";
import type { Database } from "@/types";

type Settings = Pick<
  Database["public"]["Tables"]["notification_settings"]["Row"],
  "email_enabled" | "weekly_digest_enabled"
>;

interface NotificationSettingsFormProps {
  initial: Settings;
}

export function NotificationSettingsForm({ initial }: NotificationSettingsFormProps) {
  const [emailEnabled, setEmailEnabled] = useState<boolean>(initial.email_enabled);
  const [weeklyEnabled, setWeeklyEnabled] = useState<boolean>(initial.weekly_digest_enabled);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateNotificationSettingsAction({
        email_enabled: emailEnabled,
        weekly_digest_enabled: weeklyEnabled,
      });
      if ("error" in result && result.error) {
        setMessage(`Failed to save: ${result.error}`);
      } else {
        setMessage("Saved");
      }
    });
  }

  return (
    <div className="space-y-6">
      <ToggleRow
        id="weekly-digest-toggle"
        label="Weekly digest email"
        description="Send me a Monday-morning summary of top opportunities, clusters, and alerts."
        checked={weeklyEnabled}
        onChange={setWeeklyEnabled}
      />
      <ToggleRow
        id="instant-alerts-toggle"
        label="Instant alerts"
        description="Email me whenever a new opportunity matches one of my watchlists."
        checked={emailEnabled}
        onChange={setEmailEnabled}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save preferences"}
        </button>
        {message && (
          <span className="text-sm text-muted-foreground">{message}</span>
        )}
      </div>
    </div>
  );
}

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
      />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

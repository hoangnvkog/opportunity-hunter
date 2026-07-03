"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { regenerateProjectAction } from "@/actions/venture-studio.actions";

export function RegenerateProjectButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegenerate() {
    if (!confirm("Regenerate this venture project? This will delete the existing one.")) return;
    setLoading(true);
    await regenerateProjectAction(projectId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleRegenerate}
      disabled={loading}
      className="text-xs text-blue-600 hover:underline disabled:opacity-50"
    >
      {loading ? "..." : "Regenerate"}
    </button>
  );
}

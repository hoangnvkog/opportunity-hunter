"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { regenerateModelAction } from "@/actions/financial.actions";

export function RegenerateButton({ ventureProjectId }: { ventureProjectId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegenerate() {
    if (!confirm("Regenerate this financial model? This will overwrite existing data.")) return;
    setLoading(true);
    await regenerateModelAction(ventureProjectId);
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

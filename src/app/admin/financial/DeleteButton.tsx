"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteModelAction } from "@/actions/financial.actions";

export function DeleteButton({ modelId }: { modelId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this financial model? This cannot be undone.")) return;
    setLoading(true);
    await deleteModelAction(modelId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      {loading ? "..." : "Delete"}
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteProjectAction } from "@/actions/venture-studio.actions";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this venture project? This cannot be undone.")) return;
    setLoading(true);
    await deleteProjectAction(projectId);
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

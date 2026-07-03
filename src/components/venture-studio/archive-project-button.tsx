"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { archiveProjectAction } from "@/actions/venture-studio.actions";

export function ArchiveProjectButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleArchive() {
    setLoading(true);
    await archiveProjectAction(projectId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleArchive}
      disabled={loading}
      className="text-xs text-yellow-600 hover:underline disabled:opacity-50"
    >
      {loading ? "..." : "Archive"}
    </button>
  );
}

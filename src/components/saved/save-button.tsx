"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toggleSavedAction } from "@/actions/saved-opportunities.actions";
import { cn } from "@/lib/utils";

interface SaveButtonProps {
  opportunityId: string;
  isSaved: boolean;
  className?: string;
}

export function SaveButton({ opportunityId, isSaved, className }: SaveButtonProps) {
  const [saved, setSaved] = useState(isSaved);
  const [loading, setLoading] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await toggleSavedAction(opportunityId);
      if (result.success) {
        setSaved(result.saved);
      }
    } catch (error) {
      console.error("Failed to toggle save:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "p-2 rounded-full transition-colors hover:bg-muted",
        loading && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={saved ? "Unsave opportunity" : "Save opportunity"}
      title={saved ? "Unsave opportunity" : "Save opportunity"}
    >
      <Star
        className={cn(
          "w-5 h-5 transition-colors",
          saved ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
        )}
      />
    </button>
  );
}

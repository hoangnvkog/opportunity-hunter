"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateForecastAction } from "@/actions/forecast.actions";

interface RegenerateButtonProps {
  opportunityId: string;
}

export function RegenerateButton({ opportunityId }: RegenerateButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const handleClick = () => {
    setDone(false);
    startTransition(async () => {
      await generateForecastAction(opportunityId);
      setDone(true);
    });
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
      {isPending ? "Regenerating…" : done ? "Done ✓" : "Regenerate"}
    </Button>
  );
}

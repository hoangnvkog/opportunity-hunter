"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";
import { Moon, Sun, Monitor } from "lucide-react";

const emptySubscribe = () => () => {};

/** Returns true only on the client, avoiding setState-in-effect lint errors. */
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useHasMounted();

  if (!mounted) {
    return (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" disabled>
          <Sun className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" disabled>
          <Moon className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" disabled>
          <Monitor className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <Button
        variant={theme === "light" ? "default" : "ghost"}
        size="icon"
        onClick={() => setTheme("light")}
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "ghost"}
        size="icon"
        onClick={() => setTheme("dark")}
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "system" ? "default" : "ghost"}
        size="icon"
        onClick={() => setTheme("system")}
        aria-label="System theme"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  );
}

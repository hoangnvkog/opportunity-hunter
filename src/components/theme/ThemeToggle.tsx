"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

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

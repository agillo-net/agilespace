"use client";

import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-8 items-center rounded-md border border-input overflow-hidden">
      <button
        className={cn(
          "h-8 w-8 flex items-center justify-center",
          theme === "light" ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => setTheme("light")}
        aria-label="Light Mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        className={cn(
          "h-8 w-8 flex items-center justify-center",
          theme === "dark" ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => setTheme("dark")}
        aria-label="Dark Mode"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        className={cn(
          "h-8 w-8 flex items-center justify-center",
          theme === "system" ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => setTheme("system")}
        aria-label="System Mode"
      >
        <Laptop className="h-4 w-4" />
      </button>
    </div>
  );
}

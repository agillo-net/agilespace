import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CommandShortcut } from "@/components/ui/command";
import { Search } from "lucide-react";

interface CommandPaletteTriggerProps {
  onOpen: () => void;
  className?: string;
}

/**
 * Command Palette Trigger Component
 * Renders a button that opens the command palette with keyboard shortcut support
 */
export function CommandPaletteTrigger({ onOpen, className }: CommandPaletteTriggerProps) {
  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        onOpen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);

  return (
    <Button
      variant="outline"
      className={`relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2 hidden xl:flex ${className || ''}`}
      onClick={onOpen}
      aria-label="Open command palette (Cmd+K)"
      aria-keyshortcuts="Meta+K Control+K"
      title="Open command palette"
    >
      <Search className="h-4 w-4 xl:mr-2" aria-hidden="true" />
      <span className="hidden xl:inline-flex">Search issues...</span>
      <CommandShortcut 
        className="pointer-events-none absolute right-1.5 top-2.5 inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:static xl:ml-auto"
        aria-label="Keyboard shortcut: Command K"
      >
        <span className="text-xs" aria-hidden="true">⌘</span>K
      </CommandShortcut>
    </Button>
  );
}
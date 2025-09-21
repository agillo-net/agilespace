import React from 'react';
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty 
} from '@/components/ui/command';
import { OptimizedCommandList } from '@/components/command-palette/virtualized-command-list';
import { ErrorDisplay } from '@/components/command-palette/error-display';
import type { CommandPaletteError, CommandPaletteItem } from '@/types/command-palette';

interface CommandPaletteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  items: CommandPaletteItem[];
  onItemSelect: (item: CommandPaletteItem) => Promise<void>;
  isSearching: boolean;
  error: CommandPaletteError | null;
  onRetrySearch: () => void;
  onDismissError: () => void;
}

/**
 * Command Palette Dialog Component
 * Contains the main dialog interface with search input and results
 */
export function CommandPaletteDialog({ 
  isOpen,
  onOpenChange,
  searchQuery,
  onSearchChange,
  items, 
  onItemSelect,
  isSearching,
  error,
  onRetrySearch,
  onDismissError
}: CommandPaletteDialogProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onOpenChange(false);
      // Clear error when closing
      onDismissError();
    }
  };

  const handleRetry = () => {
    onRetrySearch();
  };

  return (
    <CommandDialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
      aria-label="Command palette"
    >
      <CommandInput
        placeholder="Search tracks, issues, or actions..."
        value={searchQuery}
        onValueChange={onSearchChange}
        disabled={isSearching}
        aria-label="Search for tracks, issues, or actions"
        aria-describedby={error ? "command-palette-error" : undefined}
        autoFocus
      />
      <CommandList 
        role="listbox" 
        aria-label="Search results"
        aria-live="polite"
        aria-busy={isSearching}
      >
        {error && (
          <div id="command-palette-error" role="alert" aria-live="assertive">
            <ErrorDisplay
              error={error}
              onRetry={handleRetry}
              onDismiss={onDismissError}
            />
          </div>
        )}
        
        <CommandEmpty role="status" aria-live="polite">
          {isSearching ? (
            <div className="flex items-center justify-center py-6">
              <div 
                className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" 
                aria-hidden="true"
              />
              <span>Searching...</span>
            </div>
          ) : (
            'No results found.'
          )}
        </CommandEmpty>
        
        {!error && items.length > 0 && (
          <OptimizedCommandList
            items={items}
            onSelect={onItemSelect}
            maxHeight={400}
            itemsPerPage={15}
          />
        )}
      </CommandList>
    </CommandDialog>
  );
}
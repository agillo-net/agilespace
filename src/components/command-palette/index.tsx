import React from 'react';
import { CommandPaletteProvider } from '@/lib/command-palette/context';
import { useCommandPaletteEnhanced } from '@/hooks/api/use-command-palette-enhanced';
import { CommandPaletteTrigger } from './command-palette-trigger';
import { CommandPaletteDialog } from './command-palette-dialog';

function CommandPaletteInternal() {
  const { 
    state, 
    actions, 
    items, 
    handleItemSelect, 
    retrySearch 
  } = useCommandPaletteEnhanced();

  const handleDismissError = () => {
    actions.setError(null);
  };

  return (
    <>
      <CommandPaletteTrigger onOpen={actions.openPalette} />
      <CommandPaletteDialog
        isOpen={state.isOpen}
        onOpenChange={(open) => open ? actions.openPalette() : actions.closePalette()}
        searchQuery={state.searchQuery}
        onSearchChange={actions.setSearchQuery}
        items={items}
        onItemSelect={handleItemSelect}
        isSearching={state.isSearching}
        error={state.error}
        onRetrySearch={retrySearch}
        onDismissError={handleDismissError}
      />
    </>
  );
}

export function CommandPalette() {
  return (
    <CommandPaletteProvider>
      <CommandPaletteInternal />
    </CommandPaletteProvider>
  );
}

// Export sub-components for flexibility
export { CommandPaletteTrigger } from './command-palette-trigger';
export { CommandPaletteDialog } from './command-palette-dialog';
export { CommandPaletteItemComponent } from './command-palette-item';
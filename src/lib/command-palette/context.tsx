import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { 
  CommandPaletteState, 
  CommandPaletteActions, 
  CommandPaletteError 
} from '@/types/command-palette';

/**
 * Command Palette State Actions
 */
type CommandPaletteAction =
  | { type: 'OPEN_PALETTE' }
  | { type: 'CLOSE_PALETTE' }
  | { type: 'TOGGLE_PALETTE' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_DEBOUNCED_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: CommandPaletteError | null }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'RESET_STATE' };

/**
 * Initial state for command palette
 */
const initialState: CommandPaletteState = {
  isOpen: false,
  searchQuery: '',
  debouncedSearchQuery: '',
  isSearching: false,
  error: null,
};

/**
 * Command Palette Reducer
 */
function commandPaletteReducer(
  state: CommandPaletteState, 
  action: CommandPaletteAction
): CommandPaletteState {
  switch (action.type) {
    case 'OPEN_PALETTE':
      return { ...state, isOpen: true, error: null };
    
    case 'CLOSE_PALETTE':
      return { 
        ...state, 
        isOpen: false, 
        searchQuery: '', 
        debouncedSearchQuery: '',
        error: null 
      };
    
    case 'TOGGLE_PALETTE':
      return { 
        ...state, 
        isOpen: !state.isOpen,
        ...(state.isOpen ? { 
          searchQuery: '', 
          debouncedSearchQuery: '',
          error: null 
        } : {})
      };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'SET_DEBOUNCED_SEARCH_QUERY':
      return { ...state, debouncedSearchQuery: action.payload };
    
    case 'SET_SEARCHING':
      return { ...state, isSearching: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_SEARCH':
      return { 
        ...state, 
        searchQuery: '', 
        debouncedSearchQuery: '',
        error: null 
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

/**
 * Command Palette Context Type
 */
interface CommandPaletteContextType {
  state: CommandPaletteState;
  actions: CommandPaletteActions;
}

/**
 * Command Palette Context
 */
const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null);

/**
 * Command Palette Provider Props
 */
interface CommandPaletteProviderProps {
  children: React.ReactNode;
}

/**
 * Command Palette Provider Component
 */
export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [state, dispatch] = useReducer(commandPaletteReducer, initialState);

  // Memoized actions to prevent unnecessary re-renders
  const actions = useMemo<CommandPaletteActions>(() => ({
    openPalette: () => dispatch({ type: 'OPEN_PALETTE' }),
    closePalette: () => dispatch({ type: 'CLOSE_PALETTE' }),
    togglePalette: () => dispatch({ type: 'TOGGLE_PALETTE' }),
    setSearchQuery: (query: string) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query }),
    clearSearch: () => dispatch({ type: 'CLEAR_SEARCH' }),
    setError: (error: CommandPaletteError | null) => dispatch({ type: 'SET_ERROR', payload: error }),
  }), []);



  // Context value
  const contextValue = useMemo<CommandPaletteContextType>(() => ({
    state,
    actions,
  }), [state, actions]);

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

/**
 * Hook to use Command Palette Context
 */
export function useCommandPaletteContext(): CommandPaletteContextType {
  const context = useContext(CommandPaletteContext);
  
  if (!context) {
    throw new Error(
      'useCommandPaletteContext must be used within a CommandPaletteProvider'
    );
  }
  
  return context;
}

/**
 * Hook for internal command palette operations (used by the main hook)
 */
export function useCommandPaletteInternalContext() {
  const context = useContext(CommandPaletteContext);
  
  if (!context) {
    throw new Error(
      'useCommandPaletteInternalContext must be used within a CommandPaletteProvider'
    );
  }

  return context;
}
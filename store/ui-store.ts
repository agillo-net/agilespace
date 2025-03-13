import { create } from 'zustand';

interface UIState {
  // Sidebar state
  expandedSections: {
    repositories: boolean;
    projects: boolean;
    teams: boolean;
    issues: boolean;
    pullRequests: boolean;
  };
  activeOrganization: string | null;

  // Actions
  toggleSection: (section: keyof UIState['expandedSections']) => void;
  setActiveOrganization: (org: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar state
  expandedSections: {
    repositories: true,
    projects: false,
    teams: false,
    issues: true,
    pullRequests: true,
  },
  activeOrganization: null,

  // Actions
  toggleSection: (section) => set((state) => ({
    expandedSections: {
      ...state.expandedSections,
      [section]: !state.expandedSections[section]
    }
  })),
  setActiveOrganization: (activeOrganization) => set({ activeOrganization })
}));

import { create } from 'zustand';

interface User {
  name: string;
  login: string;
  email?: string;
  avatar_url: string;
}

interface Organization {
  login: string;
  avatar_url: string;
  description?: string;
  url: string;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  private: boolean;
  fork: boolean;
  updated_at: string;
}

interface Issue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  updated_at: string;
  repository_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

interface Team {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface TeamMember {
  login: string;
  avatar_url: string;
  html_url: string;
  name?: string;
  role: string;
}

interface Project {
  id: number;
  name: string;
  html_url: string;
  body: string;
}

interface PullRequest {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

interface GithubState {
  // User data
  user: User | null;
  isLoadingUser: boolean;
  userError: string | null;
  
  // Organizations 
  organizations: Organization[];
  isLoadingOrganizations: boolean;
  organizationsError: string | null;
  
  // Organization resources
  repositories: Repository[];
  projects: Project[];
  teams: Team[];
  isLoadingOrgResources: boolean;
  orgResourcesError: string | null;
  
  // User resources
  issues: Issue[];
  pullRequests: PullRequest[];
  isLoadingUserResources: boolean;
  userResourcesError: string | null;
  
  // Team members
  teamMembers: TeamMember[];
  isLoadingTeamMembers: boolean;
  teamMembersError: string | null;

  // Search results
  searchResults: Issue[];
  isSearching: boolean;
  hasSearched: boolean;
  searchError: string | null;

  // Actions
  setUser: (user: User) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setRepositories: (repos: Repository[]) => void;
  setProjects: (projects: Project[]) => void;
  setTeams: (teams: Team[]) => void;
  setIssues: (issues: Issue[]) => void;
  setPullRequests: (prs: PullRequest[]) => void;
  setTeamMembers: (members: TeamMember[]) => void;
  setSearchResults: (issues: Issue[]) => void;
  setIsLoadingUser: (loading: boolean) => void;
  setIsLoadingOrganizations: (loading: boolean) => void;
  setIsLoadingOrgResources: (loading: boolean) => void;
  setIsLoadingUserResources: (loading: boolean) => void;
  setIsLoadingTeamMembers: (loading: boolean) => void;
  setIsSearching: (searching: boolean) => void;
  setHasSearched: (hasSearched: boolean) => void;
  setUserError: (error: string | null) => void;
  setOrganizationsError: (error: string | null) => void;
  setOrgResourcesError: (error: string | null) => void;
  setUserResourcesError: (error: string | null) => void;
  setTeamMembersError: (error: string | null) => void;
  setSearchError: (error: string | null) => void;
  resetSearchState: () => void;
  resetOrgResourcesState: () => void;
  resetUserResourcesState: () => void;
  resetTeamMembersState: () => void;
}

export const useGithubStore = create<GithubState>((set) => ({
  // User state
  user: null,
  isLoadingUser: false,
  userError: null,
  
  // Organizations state
  organizations: [],
  isLoadingOrganizations: false,
  organizationsError: null,
  
  // Organization resources state
  repositories: [],
  projects: [],
  teams: [],
  isLoadingOrgResources: false,
  orgResourcesError: null,
  
  // User resources state
  issues: [],
  pullRequests: [],
  isLoadingUserResources: false,
  userResourcesError: null,
  
  // Team members state
  teamMembers: [],
  isLoadingTeamMembers: false,
  teamMembersError: null,
  
  // Search results state
  searchResults: [],
  isSearching: false,
  hasSearched: false,
  searchError: null,

  // Actions
  setUser: (user) => set({ user }),
  setOrganizations: (organizations) => set({ organizations }),
  setRepositories: (repositories) => set({ repositories }),
  setProjects: (projects) => set({ projects }),
  setTeams: (teams) => set({ teams }),
  setIssues: (issues) => set({ issues }),
  setPullRequests: (pullRequests) => set({ pullRequests }),
  setTeamMembers: (teamMembers) => set({ teamMembers }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setIsLoadingUser: (isLoadingUser) => set({ isLoadingUser }),
  setIsLoadingOrganizations: (isLoadingOrganizations) => set({ isLoadingOrganizations }),
  setIsLoadingOrgResources: (isLoadingOrgResources) => set({ isLoadingOrgResources }),
  setIsLoadingUserResources: (isLoadingUserResources) => set({ isLoadingUserResources }),
  setIsLoadingTeamMembers: (isLoadingTeamMembers) => set({ isLoadingTeamMembers }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setHasSearched: (hasSearched) => set({ hasSearched }),
  setUserError: (userError) => set({ userError }),
  setOrganizationsError: (organizationsError) => set({ organizationsError }),
  setOrgResourcesError: (orgResourcesError) => set({ orgResourcesError }),
  setUserResourcesError: (userResourcesError) => set({ userResourcesError }),
  setTeamMembersError: (teamMembersError) => set({ teamMembersError }),
  setSearchError: (searchError) => set({ searchError }),
  
  resetSearchState: () => set({ 
    searchResults: [], 
    isSearching: false, 
    hasSearched: false,
    searchError: null 
  }),
  
  resetOrgResourcesState: () => set({
    repositories: [],
    projects: [],
    teams: [],
    isLoadingOrgResources: false,
    orgResourcesError: null
  }),
  
  resetUserResourcesState: () => set({
    issues: [],
    pullRequests: [],
    isLoadingUserResources: false,
    userResourcesError: null
  }),

  resetTeamMembersState: () => set({
    teamMembers: [],
    isLoadingTeamMembers: false,
    teamMembersError: null
  })
}));

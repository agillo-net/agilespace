import { create } from "zustand";
import {
  getUserOrgs,
  getUserRepos,
  getCurrentUser,
  searchIssues,
  getOrgRepos,
  getOrgProjects,
  getOrgTeams,
  getUserIssues,
  getUserPullRequests,
} from "@/lib/github-client";

export interface GitHubRepo {
  id: string;
  name: string;
  owner: string;
  description: string;
  url: string;
  stargazerCount: number;
  forkCount: number;
}

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  url: string;
  state: string;
  created_at: string;
  repo: {
    name: string;
    owner: string;
  };
}

export interface GitHubProject {
  id: string;
  title: string;
  number: number;
  closed: boolean;
  shortDescription?: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubTeam {
  id: string;
  name: string;
  slug: string;
  description?: string;
  url?: string;
}

interface GitHubUser {
  login: string;
  name: string;
  avatarUrl: string;
  url: string;
}

interface GitHubOrg {
  login: string;
  name: string;
  avatarUrl: string;
  url: string;
}

interface GitHubState {
  // User data
  user: GitHubUser | null;
  isLoadingUser: boolean;
  userError: string | null;

  // Organizations
  orgs: GitHubOrg[];
  isLoadingOrgs: boolean;
  orgsError: string | null;

  // Repositories
  repos: GitHubRepo[];
  isLoadingRepos: boolean;
  reposError: string | null;

  // Organization resources
  orgRepos: GitHubRepo[];
  orgProjects: GitHubProject[];
  orgTeams: GitHubTeam[];
  isLoadingOrgResources: boolean;
  orgResourcesError: string | null;

  // User resources
  userIssues: GitHubIssue[];
  userPullRequests: any[];
  isLoadingUserResources: boolean;
  userResourcesError: string | null;

  // Search
  searchResults: GitHubIssue[];
  isSearching: boolean;
  hasSearched: boolean;
  searchError: string | null;

  // Actions
  fetchUserProfile: () => Promise<void>;
  fetchUserOrgs: () => Promise<void>;
  fetchUserRepos: () => Promise<void>;
  fetchOrgResources: (org: string) => Promise<void>;
  fetchUserResources: () => Promise<void>;
  searchIssues: (query: string, orgs: string[]) => Promise<void>;
  setSearchResults: (issues: GitHubIssue[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setHasSearched: (hasSearched: boolean) => void;
  setSearchError: (error: string | null) => void;
  resetSearchState: () => void;
  setOrgRepos: (repos: GitHubRepo[]) => void;
  setOrgProjects: (projects: GitHubProject[]) => void;
  setOrgTeams: (teams: GitHubTeam[]) => void;
  setIsLoadingOrgResources: (loading: boolean) => void;
  setOrgResourcesError: (error: string | null) => void;
  resetOrgResourcesState: () => void;
  setUserIssues: (issues: GitHubIssue[]) => void;
  setUserPullRequests: (prs: any[]) => void;
  setIsLoadingUserResources: (loading: boolean) => void;
  setUserResourcesError: (error: string | null) => void;
  resetUserResourcesState: () => void;
}

export const useGithubStore = create<GitHubState>((set, get) => ({
  // User data
  user: null,
  isLoadingUser: false,
  userError: null,

  // Organizations
  orgs: [],
  isLoadingOrgs: false,
  orgsError: null,

  // Repositories
  repos: [],
  isLoadingRepos: false,
  reposError: null,

  // Organization resources
  orgRepos: [],
  orgProjects: [],
  orgTeams: [],
  isLoadingOrgResources: false,
  orgResourcesError: null,

  // User resources
  userIssues: [],
  userPullRequests: [],
  isLoadingUserResources: false,
  userResourcesError: null,

  // Search
  searchResults: [],
  isSearching: false,
  hasSearched: false,
  searchError: null,

  // Actions
  fetchUserProfile: async () => {
    set({ isLoadingUser: true, userError: null });

    try {
      // Use Octokit REST API via our client utility
      const userData = await getCurrentUser();

      // Transform the data to match our interface
      const user: GitHubUser = {
        login: userData.login,
        name: userData.name || userData.login,
        avatarUrl: userData.avatar_url,
        url: userData.html_url,
      };

      set({ user, isLoadingUser: false });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      set({
        userError:
          error instanceof Error
            ? error.message
            : "Failed to fetch user profile",
        isLoadingUser: false,
      });
    }
  },

  fetchUserOrgs: async () => {
    set({ isLoadingOrgs: true, orgsError: null });

    try {
      // Use Octokit REST API via our client utility
      const orgsData = await getUserOrgs();

      // Transform the data to match our interface
      const orgs: GitHubOrg[] = orgsData.map((org) => ({
        login: org.login,
        name: org.login,
        avatarUrl: org.avatar_url,
        url: org.url,
      }));

      set({ orgs, isLoadingOrgs: false });
    } catch (error) {
      console.error("Error fetching user organizations:", error);
      set({
        orgsError:
          error instanceof Error
            ? error.message
            : "Failed to fetch organizations",
        isLoadingOrgs: false,
        // Don't clear existing orgs if we have them
        orgs: get().orgs,
      });
    }
  },

  fetchUserRepos: async () => {
    set({ isLoadingRepos: true, reposError: null });

    try {
      // Use Octokit REST API via our client utility
      const reposData = await getUserRepos({ sort: "updated" });

      // Transform the data to match our interface
      const repos: GitHubRepo[] = reposData.map((repo) => ({
        id: repo.node_id,
        name: repo.name,
        owner: repo.owner.login,
        description: repo.description || "",
        url: repo.html_url,
        stargazerCount: repo.stargazers_count,
        forkCount: repo.forks_count,
      }));

      set({ repos, isLoadingRepos: false });
    } catch (error) {
      console.error("Error fetching user repositories:", error);
      set({
        reposError:
          error instanceof Error
            ? error.message
            : "Failed to fetch repositories",
        isLoadingRepos: false,
      });
    }
  },

  fetchOrgResources: async (org) => {
    set({ isLoadingOrgResources: true, orgResourcesError: null });
    try {
      const [repos, projects, teams] = await Promise.all([
        getOrgRepos(org),
        getOrgProjects(org),
        getOrgTeams(org),
      ]);
      set({
        orgRepos: repos.map((repo) => ({
          id: repo.node_id,
          name: repo.name,
          owner: repo.owner.login,
          description: repo.description || "",
          url: repo.html_url,
          stargazerCount: repo.stargazers_count || 0,
          forkCount: repo.forks_count || 0,
        })),
        orgProjects: projects,
        orgTeams: teams.map((team) => ({
          id: team.id.toString(),
          name: team.name,
          slug: team.slug,
          description: team.description || undefined,
          url: team.html_url || undefined,
        })),
        isLoadingOrgResources: false,
      });
    } catch (error) {
      set({
        orgResourcesError:
          error instanceof Error
            ? error.message
            : "Failed to load organization resources",
        isLoadingOrgResources: false,
      });
    }
  },

  fetchUserResources: async () => {
    set({ isLoadingUserResources: true, userResourcesError: null });
    try {
      const [issues, prs] = await Promise.all([
        getUserIssues(),
        getUserPullRequests(),
      ]);
      set({
        userIssues: issues.map((issue) => ({
          id: issue.node_id,
          number: issue.number,
          title: issue.title,
          url: issue.html_url,
          state: issue.state.toUpperCase(),
          created_at: issue.created_at,
          repo: {
            name: issue.repository_url.split("/").pop() || "",
            owner: issue.repository_url.split("/").slice(-2, -1)[0] || "",
          },
        })),
        userPullRequests: prs,
        isLoadingUserResources: false,
      });
    } catch (error) {
      set({
        userResourcesError:
          error instanceof Error
            ? error.message
            : "Failed to load user resources",
        isLoadingUserResources: false,
      });
    }
  },

  searchIssues: async (query: string, orgs: string[]) => {
    set({ isSearching: true, hasSearched: true, searchError: null });

    try {
      // Construct the search query with organization filters
      const orgFilters = orgs.map((org) => `org:${org}`).join(" ");
      const searchQuery = `${query} ${orgFilters} is:issue`.trim();

      // Use Octokit REST API via our client utility
      const searchData = await searchIssues(searchQuery, {
        sort: "updated",
        order: "desc",
      });

      // Transform the data to match our interface
      const issues: GitHubIssue[] = searchData.items.map((item) => ({
        id: item.node_id,
        number: item.number,
        title: item.title,
        url: item.html_url,
        state: item.state.toUpperCase(),
        created_at: item.created_at,
        repo: {
          name: item.repository_url.split("/").pop() || "",
          owner: item.repository_url.split("/").slice(-2, -1)[0] || "",
        },
      }));

      set({ searchResults: issues, isSearching: false });
    } catch (error) {
      console.error("Error searching issues:", error);
      set({
        searchError:
          error instanceof Error ? error.message : "Failed to search issues",
        isSearching: false,
      });
    }
  },

  setSearchResults: (issues) => set({ searchResults: issues }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setHasSearched: (hasSearched) => set({ hasSearched }),
  setSearchError: (error) => set({ searchError: error }),
  resetSearchState: () =>
    set({
      searchResults: [],
      isSearching: false,
      hasSearched: false,
      searchError: null,
    }),

  setOrgRepos: (repos) => set({ orgRepos: repos }),
  setOrgProjects: (projects) => set({ orgProjects: projects }),
  setOrgTeams: (teams) => set({ orgTeams: teams }),
  setIsLoadingOrgResources: (loading) =>
    set({ isLoadingOrgResources: loading }),
  setOrgResourcesError: (error) => set({ orgResourcesError: error }),
  resetOrgResourcesState: () =>
    set({
      orgRepos: [],
      orgProjects: [],
      orgTeams: [],
      orgResourcesError: null,
    }),

  setUserIssues: (issues) => set({ userIssues: issues }),
  setUserPullRequests: (prs) => set({ userPullRequests: prs }),
  setIsLoadingUserResources: (loading) =>
    set({ isLoadingUserResources: loading }),
  setUserResourcesError: (error) => set({ userResourcesError: error }),
  resetUserResourcesState: () =>
    set({ userIssues: [], userPullRequests: [], userResourcesError: null }),
}));

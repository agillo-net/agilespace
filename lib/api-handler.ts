import { useGithubStore } from "@/store/github-store";
import { useRepositoryStore } from "@/store/repository-store";
import * as apiServices from "./api-services";

export function useGithubApi() {
  const {
    setUser,
    setOrganizations,
    setRepositories,
    setProjects,
    setTeams,
    setIssues,
    setPullRequests,
    setSearchResults,
    setIsLoadingUser,
    setIsLoadingOrganizations,
    setIsLoadingOrgResources,
    setIsLoadingUserResources,
    setIsSearching,
    setHasSearched,
    setUserError,
    setOrganizationsError,
    setOrgResourcesError,
    setUserResourcesError,
    setSearchError,
  } = useGithubStore();

  // User data
  const fetchUserData = async () => {
    setIsLoadingUser(true);
    setUserError(null);
    
    try {
      const userData = await apiServices.fetchUserData();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserError(error instanceof Error ? error.message : "Failed to fetch user data");
      throw error;
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Organizations data
  const fetchOrganizations = async () => {
    setIsLoadingOrganizations(true);
    setOrganizationsError(null);
    
    try {
      const orgsData = await apiServices.fetchOrganizations();
      setOrganizations(orgsData);
      return orgsData;
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setOrganizationsError(error instanceof Error ? error.message : "Failed to fetch organizations");
      throw error;
    } finally {
      setIsLoadingOrganizations(false);
    }
  };

  // Organization resources
  const fetchOrganizationResources = async (orgName: string) => {
    setIsLoadingOrgResources(true);
    setOrgResourcesError(null);
    
    try {
      // Fetch repos, projects, and teams in parallel
      const [reposData, projectsData, teamsData] = await Promise.all([
        apiServices.fetchOrganizationRepositories(orgName),
        apiServices.fetchOrganizationProjects(orgName),
        apiServices.fetchOrganizationTeams(orgName)
      ]);
      
      setRepositories(reposData);
      setProjects(projectsData);
      setTeams(teamsData);
      
      return { repositories: reposData, projects: projectsData, teams: teamsData };
    } catch (error) {
      console.error("Error fetching organization resources:", error);
      setOrgResourcesError(error instanceof Error ? error.message : "Failed to load organization resources");
      throw error;
    } finally {
      setIsLoadingOrgResources(false);
    }
  };

  // User resources
  const fetchUserResources = async () => {
    setIsLoadingUserResources(true);
    setUserResourcesError(null);
    
    try {
      // Fetch issues and PRs in parallel
      const [issuesData, prsData] = await Promise.all([
        apiServices.fetchUserIssues(),
        apiServices.fetchUserPullRequests()
      ]);
      
      setIssues(issuesData);
      setPullRequests(prsData);
      
      return { issues: issuesData, pullRequests: prsData };
    } catch (error) {
      console.error("Error fetching user resources:", error);
      setUserResourcesError(error instanceof Error ? error.message : "Failed to load user resources");
      throw error;
    } finally {
      setIsLoadingUserResources(false);
    }
  };

  // Search issues
  const searchIssues = async (query: string, orgs: string[]) => {
    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);
    
    try {
      const data = await apiServices.searchIssues(query, orgs);
      setSearchResults(data);
      return data;
    } catch (error) {
      console.error("Error searching issues:", error);
      setSearchError(error instanceof Error ? error.message : "Failed to search issues");
      throw error;
    } finally {
      setIsSearching(false);
    }
  };

  return {
    fetchUserData,
    fetchOrganizations,
    fetchOrganizationResources,
    fetchUserResources,
    searchIssues,
  };
}

export function useRepositoryApi() {
  const {
    setRepository,
    setOrganizationDetails,
    setOrganizationRepositories,
    setIsLoadingRepository,
    setIsLoadingOrganization,
    setRepositoryError,
    setOrganizationError,
    generateSampleAnalyticsData,
  } = useRepositoryStore();

  // Repository data
  const fetchRepositoryData = async (orgName: string, repoName: string) => {
    setIsLoadingRepository(true);
    setRepositoryError(null);
    
    try {
      // Try to fetch real repository data
      try {
        const data = await apiServices.fetchRepositoryDetails(orgName, repoName);
        setRepository(data);
        generateSampleAnalyticsData();
        return data;
      } catch {
        // Fallback to sample data if API fails
        console.log('Using sample repository data');
        const fallbackData = {
          id: 123456789,
          name: repoName,
          description: "Sample repository with analytics data",
          html_url: `https://github.com/${orgName}/${repoName}`,
          owner: {
            login: orgName,
            avatar_url: `https://github.com/${orgName}.png`
          },
          stargazers_count: 42,
          forks_count: 13,
          language: "TypeScript",
          open_issues_count: 8,
          default_branch: "main"
        };
        setRepository(fallbackData);
        generateSampleAnalyticsData();
        return fallbackData;
      }
    } catch (error) {
      console.error('Error fetching repository data:', error);
      setRepositoryError(error instanceof Error ? error.message : 'Unknown error occurred');
      throw error;
    } finally {
      setIsLoadingRepository(false);
    }
  };

  // Organization data
  const fetchOrganizationData = async (orgName: string) => {
    setIsLoadingOrganization(true);
    setOrganizationError(null);
    
    try {
      // Fetch organization details and repositories in parallel
      const [orgDetails, repos] = await Promise.all([
        apiServices.fetchOrganizationDetails(orgName),
        apiServices.fetchOrganizationRepositories(orgName)
      ]);
      
      setOrganizationDetails(orgDetails);
      setOrganizationRepositories(repos);
      
      return { details: orgDetails, repositories: repos };
    } catch (error) {
      console.error('Error fetching organization data:', error);
      setOrganizationError(error instanceof Error ? error.message : 'Unknown error occurred');
      throw error;
    } finally {
      setIsLoadingOrganization(false);
    }
  };

  return {
    fetchRepositoryData,
    fetchOrganizationData,
  };
}

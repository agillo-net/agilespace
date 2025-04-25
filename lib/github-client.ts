import { Octokit } from "octokit";
import { createClient } from "@/lib/supabase/client";

// Cache the Octokit instance
let octokitInstance: Octokit | null = null;

/**
 * Get an authenticated Octokit instance using the GitHub token from Supabase auth
 * @returns Authenticated Octokit instance
 */
export async function getOctokit(): Promise<Octokit> {
  // Return cached instance if available
  if (octokitInstance) {
    return octokitInstance;
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Authentication required. Please sign in with GitHub.");
  }

  const githubToken = session.provider_token;
  if (!githubToken) {
    throw new Error("No GitHub token found. Please sign in with GitHub again.");
  }

  // Create and cache the Octokit instance
  octokitInstance = new Octokit({
    auth: githubToken,
  });

  return octokitInstance;
}

/**
 * REST API helper functions - these use Octokit directly
 */

/**
 * Get the authenticated user's information
 */
export async function getCurrentUser() {
  const octokit = await getOctokit();
  const { data } = await octokit.rest.users.getAuthenticated();
  return data;
}

/**
 * Get repositories for the authenticated user
 * @param options Options for the request
 */
export async function getUserRepos(
  options: {
    sort?: "created" | "updated" | "pushed" | "full_name";
    per_page?: number;
    page?: number;
  } = {}
) {
  const octokit = await getOctokit();
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: options.sort || "updated",
    per_page: options.per_page || 100,
    page: options.page || 1,
  });
  return data;
}

/**
 * Get organizations for the authenticated user (REST API version using Octokit)
 */
export async function getUserOrgs(
  options: {
    per_page?: number;
    page?: number;
  } = {}
) {
  const octokit = await getOctokit();
  const { data } = await octokit.rest.orgs.listForAuthenticatedUser({
    per_page: options.per_page || 100,
    page: options.page || 1,
  });
  return data;
}

/**
 * Search issues on GitHub
 * @param query Search query
 * @param options Search options
 */
export async function searchIssues(
  query: string,
  options: {
    per_page?: number;
    page?: number;
    sort?: "created" | "updated" | "comments";
    order?: "asc" | "desc";
  } = {}
) {
  const octokit = await getOctokit();
  const { data } = await octokit.rest.search.issuesAndPullRequests({
    q: query,
    per_page: options.per_page || 100,
    page: options.page || 1,
    sort: options.sort,
    order: options.order,
  });
  return data;
}

/**
 * Get repositories for a specific organization
 * @param org Organization name
 * @param options Options for the request
 */
export async function getOrgRepos(
  org: string,
  options: {
    type?: "all" | "public" | "private" | "forks" | "sources" | "member";
    sort?: "created" | "updated" | "pushed" | "full_name";
    per_page?: number;
    page?: number;
  } = {}
) {
  const octokit = await getOctokit();
  const { data } = await octokit.rest.repos.listForOrg({
    org,
    type: options.type || "all",
    sort: options.sort || "updated",
    per_page: options.per_page || 100,
    page: options.page || 1,
  });
  return data;
}

/**
 * Get projects (ProjectsV2) for a specific organization (GraphQL)
 * @param org Organization name
 */
export async function getOrgProjects(org: string) {
  const octokit = await getOctokit();
  const query = `
    query($org: String!) {
      organization(login: $org) {
        projectsV2(first: 100) {
          nodes {
            id
            title
            number
            closed
            shortDescription
            url
            createdAt
            updatedAt
          }
        }
      }
    }
  `;
  const result = (await octokit.graphql(query, { org })) as {
    organization?: { projectsV2?: { nodes?: any[] } };
  };
  return result.organization?.projectsV2?.nodes || [];
}

/**
 * Get teams for a specific organization
 * @param org Organization name
 */
export async function getOrgTeams(org: string) {
  const octokit = await getOctokit();
  const { data } = await octokit.rest.teams.list({ org, per_page: 100 });
  return data;
}

/**
 * Get issues assigned to the authenticated user
 */
export async function getUserIssues() {
  const octokit = await getOctokit();
  const { data } = await octokit.rest.issues.listForAuthenticatedUser({
    filter: "assigned",
    state: "open",
    per_page: 100,
  });
  return data;
}

/**
 * Get pull requests created by or review-requested for the authenticated user
 */
export async function getUserPullRequests() {
  const octokit = await getOctokit();
  // Get username
  const user = await getCurrentUser();
  const username = user.login;
  // Search for open PRs created by or review-requested for the user
  const { data } = await octokit.rest.search.issuesAndPullRequests({
    q: `is:pr is:open (author:${username} OR review-requested:${username})`,
    per_page: 100,
  });
  return data.items;
}

/**
 * Get people in a specific organization
 * @param org Organization name
 */
export async function getOrgPeople(org: string) {
  const octokit = await getOctokit();
  const { data } = await octokit.rest.orgs.listMembers({
    org,
    per_page: 100,
  });
  return data;
}

/*
 * Get repositories for a specific organization (REST)
 * @param org Organization name
 */
export async function getOrgReposRest(org: string) {
  const octokit = await getOctokit();
  const { data } = await octokit.rest.repos.listForOrg({
    org,
    type: "all",
    per_page: 100,
  });
  return data;
}

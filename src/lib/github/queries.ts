import { getOctokitClient } from "@/lib/github/client";
import type { GitHubIssue } from "@/types";

export { getOctokitClient };

export async function getCurrentUser() {
  const octokit = await getOctokitClient();
  if (!octokit) throw new Error("Octokit client not initialized");
  return octokit.rest.users.getAuthenticated();
}

export async function getUserOrgs() {
  const octokit = await getOctokitClient();
  if (!octokit) throw new Error("Octokit client not initialized");
  return (await octokit.rest.orgs.listForAuthenticatedUser()).data;
}

export async function getRepo(org: string, repo: string) {
  const octokit = await getOctokitClient();
  if (!octokit) throw new Error("Octokit client not initialized");
  try {
    return await octokit.rest.repos.get({ owner: org, repo });
  } catch (error) {
    console.error("Error fetching repository:", error);
    throw error;
  }
}

export async function searchIssues(
  orgs: string[] | string,
  query: string = "",
  options: {} = {}
): Promise<GitHubIssue[]> {
  const octokit = await getOctokitClient();
  if (!octokit) throw new Error("Octokit client not initialized");
  if (!orgs || orgs.length === 0) {
    throw new Error("At least one organization is required");
  }

  // Build the search query
  let searchQuery = "is:open is:issue";
  if (Array.isArray(orgs)) {
    orgs = orgs.filter((org) => typeof org === "string" && org.trim() !== "");
  } else if (typeof orgs === "string") {
    orgs = [orgs.trim()];
  }
  orgs.forEach((org) => {
    searchQuery += ` org:${org}`;
  });
  if (query) {
    searchQuery += ` ${query}`;
  }

  try {
    const results = await octokit.rest.search.issuesAndPullRequests({
      q: searchQuery,
      per_page: 100, // Adjust as needed, max is 100
      sort: "updated",
      order: "desc",
      ...options,
    });

    // Fetch repo object details for each issue
    if (results.data.items.length === 0) {
      return [];
    }
    const repoUrls = results.data.items.map((issue) => issue.repository_url);
    const uniqueRepoUrls = Array.from(new Set(repoUrls));
    const repoDetails = await Promise.all(
      uniqueRepoUrls.map(async (url) => {
        const [owner, repo] = url.split("/").slice(-2);
        return await octokit.rest.repos.get({ owner, repo });
      })
    );

    // Join issue data with repo details
    return results.data.items.map((issue) => {
      const repoUrl = issue.repository_url;
      const repoDetail = repoDetails.find(
        (repo) => repo.data.full_name === repoUrl.split("/").slice(-2).join("/")
      );
      return {
        ...issue,
        repository: {
          owner: repoDetail?.data.owner.login,
          name: repoDetail?.data.name,
        },
      };
    });
  } catch (error) {
    console.error("Error searching GitHub issues:", error);
    throw error;
  }
}

export async function getUser(userId: number) {
  const octokit = await getOctokitClient();
  if (!octokit) throw new Error("Octokit client not initialized");
  try {
    return await octokit.rest.users.getById({ account_id: userId });
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

export async function getOrgRepositories(org: string) {
  const octokit = await getOctokitClient();
  if (!octokit) throw new Error("Octokit client not initialized");
  try {
    const response = await octokit.rest.repos.listForOrg({
      org,
      type: "all",
      sort: "updated",
      per_page: 100,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching organization repositories:", error);
    throw error;
  }
}

export async function getOrganizationById(orgId: number) {
  const octokit = await getOctokitClient();
  if (!octokit) throw new Error("Octokit client not initialized");

  // GitHub API doesn't have a direct endpoint to get org by ID
  // We need to get the user's organizations and find the one with matching ID
  const response = await octokit.rest.orgs.listForAuthenticatedUser();
  const org = response.data.find(o => o.id === orgId);

  if (!org) {
    throw new Error(`Organization with ID ${orgId} not found`);
  }

  return org;
}

export async function getUserRepoPermission(owner: string, repo: string) {
  const octokit = await getOctokitClient();
  if (!octokit) throw new Error("Octokit client not initialized");

  try {
    const response = await octokit.rest.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username: (await getCurrentUser()).data.login,
    });

    return response.data.permission;
  } catch (error: any) {
    // If we get 404, user doesn't have access
    if (error.status === 404) {
      return 'none';
    }
    console.error("Error fetching repo permission:", error);
    throw error;
  }
}

export async function getOrgReposWithPermissions(org: string) {
  const octokit = await getOctokitClient();
  if (!octokit) throw new Error("Octokit client not initialized");

  try {
    // Get all repos for the org that the user has access to
    const response = await octokit.rest.repos.listForOrg({
      org,
      type: "all",
      sort: "updated",
      per_page: 100,
    });

    // For each repo, get the user's permission level
    const reposWithPermissions = await Promise.all(
      response.data.map(async (repo) => {
        try {
          const permissionResponse = await octokit.rest.repos.getCollaboratorPermissionLevel({
            owner: repo.owner.login,
            repo: repo.name,
            username: (await getCurrentUser()).data.login,
          });

          return {
            owner: repo.owner.login,
            name: repo.name,
            permission: permissionResponse.data.permission,
            full_name: repo.full_name,
            private: repo.private,
          };
        } catch (error: any) {
          // If we get 404, user doesn't have access to this specific repo
          if (error.status === 404) {
            return {
              owner: repo.owner.login,
              name: repo.name,
              permission: 'none',
              full_name: repo.full_name,
              private: repo.private,
            };
          }
          // For other errors, skip this repo
          console.error(`Error fetching permission for ${repo.full_name}:`, error);
          return null;
        }
      })
    );

    // Filter out null values (repos that had errors)
    return reposWithPermissions.filter((repo) => repo !== null);
  } catch (error) {
    console.error("Error fetching org repositories with permissions:", error);
    throw error;
  }
}

export async function checkRepositoryAccess(
  owner: string,
  repo: string
): Promise<boolean> {
  const octokit = await getOctokitClient();
  if (!octokit) return false;

  try {
    // Try to get the repository - this will fail if user doesn't have access
    await octokit.rest.repos.get({ owner, repo });
    return true;
  } catch (error: unknown) {
    // If it's a 404 or 403, user doesn't have access
    if (error && typeof error === 'object' && 'status' in error &&
        (error.status === 404 || error.status === 403)) {
      return false;
    }
    // For other errors, assume no access for safety
    console.error("Error checking repository access:", error);
    return false;
  }
}

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

export async function searchIssues(
  orgs: string[] | string,
  query: string = "",
  options: object = {}
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

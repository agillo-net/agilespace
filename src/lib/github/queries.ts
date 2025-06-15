import { getOctokitClient } from "@/lib/github/client";
import type { GitHubIssue } from "@/types";

export { getOctokitClient }

const octokit = await getOctokitClient();

export async function getCurrentUser() {
  return octokit.rest.users.getAuthenticated();
}

export async function getUserOrgs() {
  return (await octokit.rest.orgs.listForAuthenticatedUser()).data;
}

export async function getRepo(org: string, repo: string) {
  try {
    return await octokit.rest.repos.get({ owner: org, repo });
  } catch (error) {
    console.error("Error fetching repository:", error);
    throw error;
  }
}

export async function searchIssues(orgs: string[] | string, query: string = '', options: {} = {}): Promise<GitHubIssue[]> {
  if (!orgs || orgs.length === 0) {
    throw new Error("At least one organization is required");
  }

  // Build the search query
  let searchQuery = 'is:open is:issue';
  if (Array.isArray(orgs)) {
    orgs = orgs.filter(org => typeof org === 'string' && org.trim() !== '');
  } else if (typeof orgs === 'string') {
    orgs = [orgs.trim()];
  }
  orgs.forEach(org => {
    searchQuery += ` org:${org}`;
  });
  if (query) {
    searchQuery += ` ${query}`;
  }

  try {
    const results = await octokit.rest.search.issuesAndPullRequests({
      q: searchQuery,
      per_page: 100, // Adjust as needed, max is 100
      sort: 'updated',
      order: 'desc',
      ...options,
    });

    // Fetch repo object details for each issue
    if (results.data.items.length === 0) {
      return [];
    }
    const repoUrls = results.data.items.map(issue => issue.repository_url);
    const uniqueRepoUrls = Array.from(new Set(repoUrls));
    const repoDetails = await Promise.all(
      uniqueRepoUrls.map(url => {
        const [owner, repo] = url.split('/').slice(-2);
        return octokit.rest.repos.get({ owner, repo });
      })
    );

    // Join issue data with repo details
    return results.data.items.map(issue => {
      const repoUrl = issue.repository_url;
      const repoDetail = repoDetails.find(repo => repo.data.full_name === repoUrl.split('/').slice(-2).join('/'));
      return {
        ...issue,
        repository: {
          owner: repoDetail?.data.owner.login,
          name: repoDetail?.data.name
        }
      };
    });
  } catch (error) {
    console.error("Error searching GitHub issues:", error);
    throw error;
  }
}

export async function getUser(userId: number) {
  try {
    return await octokit.rest.users.getById({ account_id: userId });
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

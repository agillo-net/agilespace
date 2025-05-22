import { getOctokitClient } from "@/lib/github/client";

export async function getCurrentUser() {
  const octokit = await getOctokitClient();
  return octokit.rest.users.getAuthenticated();
}

export async function getUserOrgs() {
  const octokit = await getOctokitClient();
  return octokit.rest.orgs.listForAuthenticatedUser();
}

export async function searchIssues(query: string, options: {}) {
  const octokit = await getOctokitClient();
  return octokit.rest.search.issuesAndPullRequests({
    q: query,
    ...options,
  });
}

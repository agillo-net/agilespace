import { getOctokitClient } from "@/lib/github/client";

export async function getCurrentUser() {
  const octokit = await getOctokitClient();
  return octokit.rest.users.getAuthenticated();
}

export async function getUserOrgs() {
  const octokit = await getOctokitClient();
  // TODO: Handle octokit client response status
  return (await octokit.rest.orgs.listForAuthenticatedUser()).data;
}

export async function searchIssues(query: string, options: {}) {
  const octokit = await getOctokitClient();
  return octokit.rest.search.issuesAndPullRequests({
    q: query,
    ...options,
  });
}

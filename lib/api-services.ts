// API service functions to be used by page components

export async function fetchUserData() {
  const response = await fetch("/api/github/user");
  if (!response.ok) throw new Error("Failed to fetch user data");
  return await response.json();
}

export async function fetchOrganizations() {
  const response = await fetch("/api/github/orgs");
  if (!response.ok) throw new Error("Failed to fetch organizations");
  return await response.json();
}

export async function fetchOrganizationRepositories(orgName: string) {
  const response = await fetch(`/api/github/org/${orgName}/repos`);
  if (!response.ok) throw new Error(`Failed to fetch repositories for ${orgName}`);
  return await response.json();
}

export async function fetchOrganizationProjects(orgName: string) {
  const response = await fetch(`/api/github/org/${orgName}/projects`);
  if (!response.ok) throw new Error(`Failed to fetch projects for ${orgName}`);
  return await response.json();
}

export async function fetchOrganizationTeams(orgName: string) {
  const response = await fetch(`/api/github/org/${orgName}/teams`);
  if (!response.ok) throw new Error(`Failed to fetch teams for ${orgName}`);
  return await response.json();
}

export async function fetchOrganizationDetails(orgName: string) {
  const response = await fetch(`/api/github/org/${orgName}`);
  if (!response.ok) throw new Error(`Failed to fetch details for ${orgName}`);
  return await response.json();
}

export async function fetchRepositoryDetails(orgName: string, repoName: string) {
  const response = await fetch(`/api/github/org/${orgName}/repo/${repoName}`);
  if (!response.ok) throw new Error(`Failed to fetch repository ${repoName}`);
  return await response.json();
}

export async function fetchUserIssues() {
  const response = await fetch("/api/github/issues");
  if (!response.ok) throw new Error("Failed to fetch user issues");
  return await response.json();
}

export async function fetchUserPullRequests() {
  const response = await fetch("/api/github/pull-requests");
  if (!response.ok) throw new Error("Failed to fetch user pull requests");
  return await response.json();
}

export async function searchIssues(query: string, orgs: string[]) {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  if (orgs) params.append("orgs", orgs.join(","));

  const response = await fetch(`/api/github/issues?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to search issues");
  return await response.json();
}

export async function submitIssueComment(owner: string, repo: string, issueNumber: string, comment: string) {
  const response = await fetch('/api/github/comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner, repo, issueNumber, comment }),
  });
  
  if (!response.ok) throw new Error("Failed to submit comment");
  return await response.json();
}

export async function fetchTeamMembers(orgName: string, teamSlug: string) {
  const response = await fetch(`/api/github/org/${orgName}/teams/${teamSlug}/members`);
  if (!response.ok) throw new Error(`Failed to fetch team members for ${teamSlug}`);
  return await response.json();
}

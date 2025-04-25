import { Octokit } from "octokit";
import {
  GitHubUser,
  GitHubRepo,
  GitHubOrg,
  GitHubIssue,
  GitHubTeam,
  GitHubProject,
  GitHubSearchResults,
  RepoOptions,
  OrgOptions,
  SearchOptions,
} from "./types";

/**
 * Helper functions for GitHub API
 * These are common functions used by both client and server implementations
 */

/**
 * Create an Octokit instance with the provided token
 * @param token GitHub access token
 * @returns Authenticated Octokit instance
 */
export function createOctokit(token: string): Octokit {
  return new Octokit({
    auth: token,
  });
}

/**
 * Maps GitHub API response to our GitHubUser type
 * @param data Raw GitHub API response
 * @returns Properly typed GitHubUser object
 */
function mapToGitHubUser(data: any): GitHubUser {
  return {
    id: data.id,
    login: data.login,
    node_id: data.node_id,
    avatar_url: data.avatar_url,
    html_url: data.html_url,
    name: data.name,
    company: data.company,
    blog: data.blog,
    location: data.location,
    email: data.email,
    bio: data.bio,
    twitter_username: data.twitter_username,
    public_repos: data.public_repos,
    public_gists: data.public_gists,
    followers: data.followers,
    following: data.following,
    created_at: data.created_at,
    updated_at: data.updated_at,
    type: data.type,
  };
}

/**
 * Maps GitHub API response to our GitHubOrg type
 * @param data Raw GitHub API response
 * @returns Properly typed GitHubOrg object
 */
function mapToGitHubOrg(data: any): GitHubOrg {
  return {
    id: data.id,
    login: data.login,
    node_id: data.node_id,
    avatar_url: data.avatar_url,
    name: data.name,
    company: data.company,
    blog: data.blog,
    location: data.location,
    email: data.email,
    description: data.description,
    html_url: data.html_url,
    repos_url: data.repos_url,
    events_url: data.events_url,
    hooks_url: data.hooks_url,
    issues_url: data.issues_url,
    members_url: data.members_url,
    public_members_url: data.public_members_url,
    url: data.url,
    created_at: data.created_at,
    updated_at: data.updated_at,
    type: data.type,
  };
}

/**
 * Maps GitHub API response to our GitHubRepo type
 * @param data Raw GitHub API response
 * @returns Properly typed GitHubRepo object
 */
function mapToGitHubRepo(data: any): GitHubRepo {
  return {
    id: data.id,
    node_id: data.node_id,
    name: data.name,
    full_name: data.full_name,
    // We properly map the owner to either a user or org type
    owner:
      data.owner?.type === "Organization"
        ? mapToGitHubOrg(data.owner)
        : mapToGitHubUser(data.owner),
    private: data.private,
    html_url: data.html_url,
    description: data.description,
    fork: data.fork,
    url: data.url,
    created_at: data.created_at,
    updated_at: data.updated_at,
    pushed_at: data.pushed_at,
    git_url: data.git_url,
    ssh_url: data.ssh_url,
    clone_url: data.clone_url,
    homepage: data.homepage,
    size: data.size,
    stargazers_count: data.stargazers_count,
    watchers_count: data.watchers_count,
    language: data.language,
    forks_count: data.forks_count,
    open_issues_count: data.open_issues_count,
    master_branch: data.master_branch,
    default_branch: data.default_branch,
    score: data.score || 0,
    archived: data.archived,
    disabled: data.disabled,
    visibility: data.visibility,
    topics: data.topics || [],
    allow_forking: data.allow_forking,
    is_template: data.is_template,
    web_commit_signoff_required: data.web_commit_signoff_required,
    license: data.license
      ? {
          key: data.license.key,
          name: data.license.name,
          url: data.license.url,
          spdx_id: data.license.spdx_id,
          node_id: data.license.node_id,
        }
      : null,
  };
}

/**
 * Maps GitHub API response to our GitHubLabel type
 * @param data Raw GitHub API response
 */
function mapToGitHubLabel(data: any): any {
  return {
    id: data.id,
    node_id: data.node_id,
    url: data.url,
    name: data.name,
    description: data.description,
    color: data.color,
    default: data.default,
  };
}

/**
 * Maps GitHub API response to our GitHubIssue type
 * @param data Raw GitHub API response
 * @returns Properly typed GitHubIssue object
 */
function mapToGitHubIssue(data: any): GitHubIssue {
  return {
    id: data.id,
    node_id: data.node_id,
    url: data.url,
    repository_url: data.repository_url,
    labels_url: data.labels_url,
    comments_url: data.comments_url,
    events_url: data.events_url,
    html_url: data.html_url,
    number: data.number,
    state: data.state,
    state_reason: data.state_reason,
    title: data.title,
    body: data.body,
    user: mapToGitHubUser(data.user),
    labels: Array.isArray(data.labels) ? data.labels.map(mapToGitHubLabel) : [],
    assignees: Array.isArray(data.assignees)
      ? data.assignees.map(mapToGitHubUser)
      : [],
    milestone: {
      id: data.milestone.id,
      node_id: data.milestone.node_id,
      number: data.milestone.number,
      state: data.milestone.state,
      title: data.milestone.title,
      description: data.milestone.description,
      creator: mapToGitHubUser(data.milestone.creator),
      open_issues: data.milestone.open_issues,
      closed_issues: data.milestone.closed_issues,
      created_at: data.milestone.created_at,
      updated_at: data.milestone.updated_at,
      due_on: data.milestone.due_on,
      closed_at: data.milestone.closed_at,
      url: data.milestone.url,
      html_url: data.milestone.html_url,
    },
    locked: data.locked,
    active_lock_reason: data.active_lock_reason,
    comments: data.comments,
    pull_request: data.pull_request
      ? {
          url: data.pull_request.url,
          html_url: data.pull_request.html_url,
          diff_url: data.pull_request.diff_url,
          patch_url: data.pull_request.patch_url,
          merged_at: data.pull_request.merged_at,
        }
      : undefined,
    closed_at: data.closed_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
    draft: data.draft,
    closed_by: data.closed_by ? mapToGitHubUser(data.closed_by) : undefined,
    author_association: data.author_association,
    repository: data.repository ? mapToGitHubRepo(data.repository) : undefined,
    score: data.score,
  };
}

/**
 * Maps GitHub API response to our GitHubTeam type
 * @param data Raw GitHub API response
 * @returns Properly typed GitHubTeam object
 */
function mapToGitHubTeam(data: any): GitHubTeam {
  return {
    id: data.id,
    node_id: data.node_id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    privacy: data.privacy,
    notification_setting: data.notification_setting,
    url: data.url,
    html_url: data.html_url,
    members_url: data.members_url,
    repositories_url: data.repositories_url,
    permission: data.permission,
    parent: data.parent ? mapToGitHubTeam(data.parent) : null,
    members_count: data.members_count,
    repos_count: data.repos_count,
    created_at: data.created_at,
    updated_at: data.updated_at,
    organization: data.organization
      ? mapToGitHubOrg(data.organization)
      : undefined,
  };
}

/**
 * Maps GraphQL response to our GitHubProject type
 * @param data Raw GraphQL response
 * @returns Properly typed GitHubProject object
 */
function mapToGitHubProject(data: any): GitHubProject {
  return {
    id: data.id,
    title: data.title,
    number: data.number,
    closed: data.closed,
    shortDescription: data.shortDescription,
    url: data.url,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    creator: data.creator
      ? {
          login: data.creator.login,
          avatarUrl: data.creator.avatarUrl,
          url: data.creator.url,
        }
      : undefined,
    owner: {
      login: data.owner.login,
      url: data.owner.url,
    },
  };
}

/**
 * Maps search results to our GitHubSearchResults type
 * @param data Raw GitHub API response
 * @returns Properly typed GitHubSearchResults object
 */
function mapToGitHubSearchResults(data: any): GitHubSearchResults {
  return {
    total_count: data.total_count,
    incomplete_results: data.incomplete_results,
    items: Array.isArray(data.items) ? data.items.map(mapToGitHubIssue) : [],
  };
}

/**
 * GitHub API Helper functions
 * Common functions that can be used with any Octokit instance
 */

/**
 * Get the user information
 * @param octokit Authenticated Octokit instance
 * @returns GitHub user information
 */
export async function getCurrentUser(octokit: Octokit): Promise<GitHubUser> {
  const { data } = await octokit.rest.users.getAuthenticated();
  return mapToGitHubUser(data);
}

/**
 * Get repositories for a user
 * @param octokit Authenticated Octokit instance
 * @param options Options for the request
 * @returns List of user repositories
 */
export async function getUserRepos(
  octokit: Octokit,
  options: RepoOptions = {}
): Promise<GitHubRepo[]> {
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: options.sort || "updated",
    per_page: options.per_page || 100,
    page: options.page || 1,
  });

  return Array.isArray(data) ? data.map(mapToGitHubRepo) : [];
}

/**
 * Get organizations for a user
 * @param octokit Authenticated Octokit instance
 * @param options Options for the request
 * @returns List of user organizations
 */
export async function getUserOrgs(
  octokit: Octokit,
  options: OrgOptions = {}
): Promise<GitHubOrg[]> {
  const { data } = await octokit.rest.orgs.listForAuthenticatedUser({
    per_page: options.per_page || 100,
    page: options.page || 1,
  });

  return Array.isArray(data) ? data.map(mapToGitHubOrg) : [];
}

/**
 * Search issues on GitHub
 * @param octokit Authenticated Octokit instance
 * @param query Search query
 * @param options Search options
 * @returns Search results
 */
export async function searchIssues(
  octokit: Octokit,
  query: string,
  options: SearchOptions = {}
): Promise<GitHubSearchResults> {
  const { data } = await octokit.rest.search.issuesAndPullRequests({
    q: query,
    per_page: options.per_page || 100,
    page: options.page || 1,
    sort: options.sort,
    order: options.order,
  });

  return mapToGitHubSearchResults(data);
}

/**
 * Get repositories for a specific organization
 * @param octokit Authenticated Octokit instance
 * @param org Organization name
 * @param options Options for the request
 * @returns List of organization repositories
 */
export async function getOrgRepos(
  octokit: Octokit,
  org: string,
  options: RepoOptions = {}
): Promise<GitHubRepo[]> {
  const { data } = await octokit.rest.repos.listForOrg({
    org,
    type: options.type || "all",
    sort: options.sort || "updated",
    per_page: options.per_page || 100,
    page: options.page || 1,
  });

  return Array.isArray(data) ? data.map(mapToGitHubRepo) : [];
}

/**
 * Get projects (ProjectsV2) for a specific organization (GraphQL)
 * @param octokit Authenticated Octokit instance
 * @param org Organization name
 * @returns List of organization projects
 */
export async function getOrgProjects(
  octokit: Octokit,
  org: string
): Promise<GitHubProject[]> {
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
            creator {
              login
              avatarUrl
              url
            }
            owner {
              ... on Organization {
                login
                url
              }
            }
          }
        }
      }
    }
  `;
  const result = (await octokit.graphql(query, { org })) as {
    organization?: { projectsV2?: { nodes?: any[] } };
  };

  const nodes = result.organization?.projectsV2?.nodes || [];
  return Array.isArray(nodes) ? nodes.map(mapToGitHubProject) : [];
}

/**
 * Get teams for a specific organization
 * @param octokit Authenticated Octokit instance
 * @param org Organization name
 * @returns List of organization teams
 */
export async function getOrgTeams(
  octokit: Octokit,
  org: string
): Promise<GitHubTeam[]> {
  const { data } = await octokit.rest.teams.list({ org, per_page: 100 });

  return Array.isArray(data) ? data.map(mapToGitHubTeam) : [];
}

/**
 * Get issues assigned to the authenticated user
 * @param octokit Authenticated Octokit instance
 * @returns List of user issues
 */
export async function getUserIssues(octokit: Octokit): Promise<GitHubIssue[]> {
  const { data } = await octokit.rest.issues.listForAuthenticatedUser({
    filter: "assigned",
    state: "open",
    per_page: 100,
  });

  return Array.isArray(data) ? data.map(mapToGitHubIssue) : [];
}

/**
 * Get pull requests created by or review-requested for the authenticated user
 * @param octokit Authenticated Octokit instance
 * @returns List of user pull requests
 */
export async function getUserPullRequests(
  octokit: Octokit
): Promise<GitHubIssue[]> {
  // Get username
  const user = await getCurrentUser(octokit);
  const username = user.login;

  // Search for open PRs created by or review-requested for the user
  const { data } = await octokit.rest.search.issuesAndPullRequests({
    q: `is:pr is:open (author:${username} OR review-requested:${username})`,
    per_page: 100,
  });

  return Array.isArray(data.items) ? data.items.map(mapToGitHubIssue) : [];
}

/**
 * Get people in a specific organization
 * @param octokit Authenticated Octokit instance
 * @param org Organization name
 * @returns List of organization members
 */
export async function getOrgPeople(
  octokit: Octokit,
  org: string
): Promise<GitHubUser[]> {
  const { data } = await octokit.rest.orgs.listMembers({
    org,
    per_page: 100,
  });

  return Array.isArray(data) ? data.map(mapToGitHubUser) : [];
}

/**
 * Get repositories for a specific organization (REST)
 * @param octokit Authenticated Octokit instance
 * @param org Organization name
 * @returns List of organization repositories
 */
export async function getOrgReposRest(
  octokit: Octokit,
  org: string
): Promise<GitHubRepo[]> {
  const { data } = await octokit.rest.repos.listForOrg({
    org,
    type: "all",
    per_page: 100,
  });

  return Array.isArray(data) ? data.map(mapToGitHubRepo) : [];
}

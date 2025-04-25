/**
 * GitHub API Type Definitions
 *
 * This file contains concrete type definitions for GitHub API entities
 * used throughout the application.
 */

/**
 * GitHub User Type
 * Represents a GitHub user account
 */
export interface GitHubUser {
  id: number;
  login: string;
  node_id: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  type: "User";
}

/**
 * GitHub Organization Type
 * Represents a GitHub organization
 */
export interface GitHubOrg {
  id: number;
  login: string;
  node_id: string;
  avatar_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  description: string | null;
  html_url: string;
  repos_url: string;
  events_url: string;
  hooks_url: string;
  issues_url: string;
  members_url: string;
  public_members_url: string;
  url: string;
  created_at: string;
  updated_at: string;
  type: "Organization";
}

/**
 * GitHub Repository Type
 * Represents a GitHub repository
 */
export interface GitHubRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: GitHubUser | GitHubOrg;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  master_branch?: string;
  default_branch: string;
  score: number;
  archived: boolean;
  disabled: boolean;
  visibility: "public" | "private" | "internal";
  topics: string[];
  allow_forking?: boolean;
  is_template?: boolean;
  web_commit_signoff_required?: boolean;
  license: {
    key: string;
    name: string;
    url: string;
    spdx_id: string;
    node_id: string;
  } | null;
}

/**
 * GitHub Label Type
 * Represents a label on an issue or pull request
 */
export interface GitHubLabel {
  id: number;
  node_id: string;
  url: string;
  name: string;
  description: string | null;
  color: string;
  default: boolean;
}

/**
 * GitHub Milestone Type
 * Represents a milestone on an issue or pull request
 */
export interface GitHubMilestone {
  id: number;
  node_id: string;
  number: number;
  state: "open" | "closed";
  title: string;
  description: string | null;
  creator: GitHubUser;
  open_issues: number;
  closed_issues: number;
  created_at: string;
  updated_at: string;
  due_on: string | null;
  closed_at: string | null;
  url: string;
  html_url: string;
}

/**
 * GitHub Issue Type
 * Represents a GitHub issue
 */
export interface GitHubIssue {
  id: number;
  node_id: string;
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  number: number;
  state: "open" | "closed";
  state_reason?: "completed" | "not_planned" | "reopened" | null;
  title: string;
  body: string | null;
  user: GitHubUser;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone: GitHubMilestone | null;
  locked: boolean;
  active_lock_reason: string | null;
  comments: number;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
    merged_at: string | null;
  };
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  draft?: boolean;
  closed_by?: GitHubUser;
  author_association: string;
  // Additional properties when returned from search
  repository?: GitHubRepo;
  score?: number;
}

/**
 * GitHub Pull Request Type
 * Extends the issue interface with PR-specific properties
 */
export interface GitHubPullRequest extends GitHubIssue {
  diff_url: string;
  patch_url: string;
  issue_url: string;
  commits_url: string;
  review_comments_url: string;
  review_comment_url: string;
  statuses_url: string;
  head: {
    label: string;
    ref: string;
    sha: string;
    repo: GitHubRepo;
    user: GitHubUser;
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    repo: GitHubRepo;
    user: GitHubUser;
  };
  _links: {
    self: { href: string };
    html: { href: string };
    issue: { href: string };
    comments: { href: string };
    review_comments: { href: string };
    review_comment: { href: string };
    commits: { href: string };
    statuses: { href: string };
  };
  merged: boolean;
  mergeable: boolean | null;
  rebaseable: boolean | null;
  mergeable_state: string;
  merged_by: GitHubUser | null;
  comments: number;
  review_comments: number;
  maintainer_can_modify: boolean;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
  draft: boolean;
}

/**
 * GitHub Search Results Type
 * Represents search results for issues and pull requests
 */
export interface GitHubSearchResults {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubIssue[];
}

/**
 * GitHub Team Type
 * Represents a team within an organization
 */
export interface GitHubTeam {
  id: number;
  node_id: string;
  name: string;
  slug: string;
  description: string | null;
  privacy: "secret" | "closed" | "visible";
  notification_setting?: string;
  url: string;
  html_url: string;
  members_url: string;
  repositories_url: string;
  permission: string;
  parent: GitHubTeam | null;
  members_count?: number;
  repos_count?: number;
  created_at: string;
  updated_at: string;
  organization?: GitHubOrg;
}

/**
 * GitHub Project (ProjectV2) Type
 * Represents a GitHub Project (v2)
 */
export interface GitHubProject {
  id: string;
  title: string;
  number: number;
  closed: boolean;
  shortDescription: string | null;
  url: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    login: string;
    avatarUrl: string;
    url: string;
  };
  owner: {
    login: string;
    url: string;
  };
}

/**
 * Repository Options Type
 * Used when fetching repositories via the API
 */
export interface RepoOptions {
  sort?: "created" | "updated" | "pushed" | "full_name";
  per_page?: number;
  page?: number;
  type?: "all" | "public" | "private" | "forks" | "sources" | "member";
}

/**
 * Organization Options Type
 * Used when fetching organizations via the API
 */
export interface OrgOptions {
  per_page?: number;
  page?: number;
}

/**
 * Search Options Type
 * Used when searching issues and pull requests
 */
export interface SearchOptions {
  per_page?: number;
  page?: number;
  sort?: "created" | "updated" | "comments";
  order?: "asc" | "desc";
}

/**
 * GitHub API Error Type
 * Represents an error from the GitHub API
 */
export interface GitHubApiError {
  name: string;
  status: number;
  response: {
    data: {
      message: string;
      documentation_url?: string;
    };
    status: number;
    headers: Record<string, string>;
    url: string;
  };
  message: string;
}

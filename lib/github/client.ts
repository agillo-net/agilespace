import { Octokit } from "octokit";
import { createClient } from "@/lib/supabase/client";
import * as helpers from "./helpers";
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

// Cache the Octokit instance for client-side use
let octokitClientInstance: Octokit | null = null;

/**
 * Get an authenticated Octokit instance for client components
 * @returns Authenticated Octokit instance
 */
export async function getOctokit(): Promise<Octokit> {
  // Return cached instance if available
  if (octokitClientInstance) {
    return octokitClientInstance;
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
  octokitClientInstance = helpers.createOctokit(githubToken);
  return octokitClientInstance;
}

/**
 * Client-side GitHub API functions for use in client components
 * These functions use the client-side Supabase auth
 */

export async function getCurrentUser(): Promise<GitHubUser> {
  const octokit = await getOctokit();
  return helpers.getCurrentUser(octokit);
}

export async function getUserRepos(
  options: RepoOptions = {}
): Promise<GitHubRepo[]> {
  const octokit = await getOctokit();
  return helpers.getUserRepos(octokit, options);
}

export async function getUserOrgs(
  options: OrgOptions = {}
): Promise<GitHubOrg[]> {
  const octokit = await getOctokit();
  return helpers.getUserOrgs(octokit, options);
}

export async function searchIssues(
  query: string,
  options: SearchOptions = {}
): Promise<GitHubSearchResults> {
  const octokit = await getOctokit();
  return helpers.searchIssues(octokit, query, options);
}

export async function getOrgRepos(
  org: string,
  options: RepoOptions = {}
): Promise<GitHubRepo[]> {
  const octokit = await getOctokit();
  return helpers.getOrgRepos(octokit, org, options);
}

export async function getOrgProjects(org: string): Promise<GitHubProject[]> {
  const octokit = await getOctokit();
  return helpers.getOrgProjects(octokit, org);
}

export async function getOrgTeams(org: string): Promise<GitHubTeam[]> {
  const octokit = await getOctokit();
  return helpers.getOrgTeams(octokit, org);
}

export async function getUserIssues(): Promise<GitHubIssue[]> {
  const octokit = await getOctokit();
  return helpers.getUserIssues(octokit);
}

export async function getUserPullRequests(): Promise<GitHubIssue[]> {
  const octokit = await getOctokit();
  return helpers.getUserPullRequests(octokit);
}

export async function getOrgPeople(org: string): Promise<GitHubUser[]> {
  const octokit = await getOctokit();
  return helpers.getOrgPeople(octokit, org);
}

export async function getOrgReposRest(org: string): Promise<GitHubRepo[]> {
  const octokit = await getOctokit();
  return helpers.getOrgReposRest(octokit, org);
}

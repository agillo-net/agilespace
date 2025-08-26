# GitHub Integration Agent

This agent specializes in GitHub API integrations, OAuth authentication, and issue management within the AgileSpace application.

## Expertise Areas

- GitHub OAuth authentication flow
- Octokit client configuration and usage  
- GitHub REST API operations
- Issue search and repository access
- Organization and repository management
- GitHub webhook handling

## Key Directories and Files

- `src/lib/github/client.ts` - Octokit client configuration
- `src/lib/github/queries.ts` - GitHub API read operations
- `src/lib/github/mutations.ts` - GitHub API write operations
- `src/components/command-palette.tsx` - GitHub issue search UI
- `src/components/search-form.tsx` - Issue search functionality
- `src/components/search-results-list.tsx` - Search results display

## GitHub Client Configuration

```typescript
// src/lib/github/client.ts
import { Octokit } from "@octokit/rest"
import { getSupabaseClient } from "@/lib/supabase/client"

export async function getOctokitClient(): Promise<Octokit | null> {
  const supabase = getSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    console.error('No active session for GitHub client')
    return null
  }

  // Get GitHub access token from session
  const githubToken = session.provider_token
  if (!githubToken) {
    console.error('No GitHub access token available')
    return null
  }

  return new Octokit({
    auth: githubToken,
    userAgent: 'AgileSpace/1.0',
    baseUrl: 'https://api.github.com',
    request: {
      timeout: 10000, // 10 seconds
    }
  })
}
```

## Authentication Patterns

### OAuth Setup
```typescript
// Supabase Auth configuration for GitHub
const supabase = createClient(url, key, {
  auth: {
    redirectTo: `${window.location.origin}/auth/callback`,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Initiate GitHub OAuth
export const signInWithGitHub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      scopes: 'read:user user:email read:org repo',
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  if (error) throw error
  return data
}
```

### Token Management
```typescript
// Check token validity and refresh if needed
export async function ensureValidToken(): Promise<string | null> {
  const supabase = getSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) return null
  
  // Check if token is close to expiry
  const expiresAt = session.expires_at * 1000
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000
  
  if (expiresAt - now < fiveMinutes) {
    // Refresh session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) return null
    return refreshData.session?.provider_token || null
  }
  
  return session.provider_token || null
}
```

## Core GitHub Operations

### User and Organization Data
```typescript
// src/lib/github/queries.ts
export async function getCurrentUser() {
  const octokit = await getOctokitClient()
  if (!octokit) throw new Error("GitHub client not available")
  
  try {
    const { data } = await octokit.rest.users.getAuthenticated()
    return data
  } catch (error) {
    console.error('Error fetching current user:', error)
    throw new Error('Failed to fetch GitHub user data')
  }
}

export async function getUserOrgs() {
  const octokit = await getOctokitClient()
  if (!octokit) throw new Error("GitHub client not available")
  
  try {
    const { data } = await octokit.rest.orgs.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated'
    })
    return data
  } catch (error) {
    console.error('Error fetching user organizations:', error)
    throw new Error('Failed to fetch GitHub organizations')
  }
}

export async function getOrgMembers(org: string) {
  const octokit = await getOctokitClient()
  if (!octokit) throw new Error("GitHub client not available")
  
  try {
    const { data } = await octokit.rest.orgs.listMembers({
      org,
      per_page: 100,
      role: 'all'
    })
    return data
  } catch (error) {
    console.error(`Error fetching members for org ${org}:`, error)
    throw new Error(`Failed to fetch organization members`)
  }
}
```

### Repository Operations
```typescript
export async function getRepo(owner: string, repo: string) {
  const octokit = await getOctokitClient()
  if (!octokit) throw new Error("GitHub client not available")
  
  try {
    const { data } = await octokit.rest.repos.get({ owner, repo })
    return data
  } catch (error) {
    console.error(`Error fetching repository ${owner}/${repo}:`, error)
    throw new Error('Repository not found or access denied')
  }
}

export async function getOrgRepos(org: string, options: {
  type?: 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member'
  sort?: 'created' | 'updated' | 'pushed' | 'full_name'
  direction?: 'asc' | 'desc'
  per_page?: number
} = {}) {
  const octokit = await getOctokitClient()
  if (!octokit) throw new Error("GitHub client not available")
  
  try {
    const { data } = await octokit.rest.repos.listForOrg({
      org,
      type: options.type || 'all',
      sort: options.sort || 'updated',
      direction: options.direction || 'desc',
      per_page: options.per_page || 100
    })
    return data
  } catch (error) {
    console.error(`Error fetching repositories for org ${org}:`, error)
    throw new Error('Failed to fetch organization repositories')
  }
}
```

### Issue Search and Management
```typescript
export async function searchIssues(
  orgs: string[] | string,
  query: string = "",
  options: {
    state?: 'open' | 'closed' | 'all'
    labels?: string[]
    assignee?: string
    author?: string
    sort?: 'created' | 'updated' | 'comments'
    order?: 'asc' | 'desc'
    per_page?: number
  } = {}
): Promise<GitHubIssue[]> {
  const octokit = await getOctokitClient()
  if (!octokit) throw new Error("GitHub client not available")
  
  if (!orgs || (Array.isArray(orgs) && orgs.length === 0)) {
    throw new Error("At least one organization is required")
  }

  // Normalize orgs to array
  const orgsList = Array.isArray(orgs) ? orgs : [orgs]
  const validOrgs = orgsList.filter(org => typeof org === 'string' && org.trim() !== '')
  
  if (validOrgs.length === 0) {
    throw new Error("No valid organizations provided")
  }

  // Build search query
  let searchQuery = `is:issue is:${options.state || 'open'}`
  
  // Add organization filters
  validOrgs.forEach(org => {
    searchQuery += ` org:${org}`
  })
  
  // Add text search
  if (query.trim()) {
    searchQuery += ` ${query.trim()}`
  }
  
  // Add label filters
  if (options.labels && options.labels.length > 0) {
    options.labels.forEach(label => {
      searchQuery += ` label:"${label}"`
    })
  }
  
  // Add assignee filter
  if (options.assignee) {
    searchQuery += ` assignee:${options.assignee}`
  }
  
  // Add author filter
  if (options.author) {
    searchQuery += ` author:${options.author}`
  }

  try {
    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: searchQuery,
      sort: options.sort || 'updated',
      order: options.order || 'desc',
      per_page: Math.min(options.per_page || 50, 100) // GitHub max is 100
    })

    // Enrich with repository information
    const enrichedIssues = await Promise.all(
      data.items.map(async (issue) => {
        try {
          // Extract owner and repo from repository_url
          const urlParts = issue.repository_url.split('/')
          const owner = urlParts[urlParts.length - 2]
          const repo = urlParts[urlParts.length - 1]
          
          return {
            ...issue,
            repository: { owner, name: repo }
          } as GitHubIssue
        } catch (error) {
          console.error('Error enriching issue data:', error)
          return {
            ...issue,
            repository: { owner: 'unknown', name: 'unknown' }
          } as GitHubIssue
        }
      })
    )

    return enrichedIssues
  } catch (error) {
    console.error('Error searching GitHub issues:', error)
    throw new Error('Failed to search GitHub issues')
  }
}

export async function getIssue(owner: string, repo: string, issue_number: number) {
  const octokit = await getOctokitClient()
  if (!octokit) throw new Error("GitHub client not available")
  
  try {
    const { data } = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number
    })
    return data
  } catch (error) {
    console.error(`Error fetching issue ${owner}/${repo}#${issue_number}:`, error)
    throw new Error('Issue not found or access denied')
  }
}
```

## Type Definitions

```typescript
// src/types/index.ts
export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  html_url: string
  user: {
    login: string
    avatar_url: string
    html_url: string
  }
  assignees: Array<{
    login: string
    avatar_url: string
  }>
  labels: Array<{
    name: string
    color: string
    description: string | null
  }>
  created_at: string
  updated_at: string
  closed_at: string | null
  repository: {
    owner: string
    name: string
  }
}

export interface GitHubOrganization {
  id: number
  login: string
  name: string | null
  description: string | null
  avatar_url: string
  html_url: string
  public_repos: number
  public_gists: number
  followers: number
  following: number
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  clone_url: string
  ssh_url: string
  language: string | null
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  default_branch: string
  private: boolean
  owner: {
    login: string
    avatar_url: string
  }
}
```

## Command Palette Integration

```typescript
// Command palette hook for GitHub issue search
export function useGitHubSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])
  const { data: userSpaces } = useUserSpaces()
  
  const searchIssues = useQuery({
    queryKey: ['github-search', searchQuery, selectedOrgs],
    queryFn: () => {
      if (!searchQuery.trim() || selectedOrgs.length === 0) {
        return []
      }
      return searchIssues(selectedOrgs, searchQuery)
    },
    enabled: searchQuery.trim().length > 2 && selectedOrgs.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: []
  })

  return {
    searchQuery,
    setSearchQuery,
    selectedOrgs,
    setSelectedOrgs,
    results: searchIssues.data || [],
    isLoading: searchIssues.isLoading,
    error: searchIssues.error
  }
}
```

## Error Handling Patterns

```typescript
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'GitHubAPIError'
  }
}

export async function handleGitHubError<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation()
  } catch (error: any) {
    console.error(`GitHub API error in ${context}:`, error)
    
    if (error.status === 401) {
      throw new GitHubAPIError('GitHub authentication expired. Please sign in again.', 401)
    } else if (error.status === 403) {
      throw new GitHubAPIError('GitHub API rate limit exceeded or insufficient permissions.', 403)
    } else if (error.status === 404) {
      throw new GitHubAPIError('GitHub resource not found.', 404)
    } else if (error.status >= 500) {
      throw new GitHubAPIError('GitHub API server error. Please try again later.', error.status)
    } else {
      throw new GitHubAPIError(`GitHub API error: ${error.message}`, error.status, error)
    }
  }
}
```

## Rate Limiting and Performance

```typescript
// Rate limiting utilities
export class RateLimiter {
  private requests: number[] = []
  private maxRequests: number
  private timeWindow: number // in milliseconds
  
  constructor(maxRequests: number = 5000, timeWindow: number = 3600000) { // 5000 per hour
    this.maxRequests = maxRequests
    this.timeWindow = timeWindow
  }
  
  async checkLimit(): Promise<boolean> {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    
    if (this.requests.length >= this.maxRequests) {
      throw new GitHubAPIError('Rate limit exceeded. Please wait before making more requests.')
    }
    
    this.requests.push(now)
    return true
  }
}

// Batch operations
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  batchSize: number = 10,
  delay: number = 1000
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(item => operation(item))
    )
    results.push(...batchResults)
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return results
}
```

## Webhook Integration

```typescript
// GitHub webhook handling
export async function handleGitHubWebhook(
  event: string,
  payload: any,
  signature: string
) {
  // Verify webhook signature
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('GitHub webhook secret not configured')
  }
  
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex')}`
  
  if (signature !== expectedSignature) {
    throw new Error('Invalid webhook signature')
  }
  
  // Handle different event types
  switch (event) {
    case 'issues':
      return await handleIssueEvent(payload)
    case 'pull_request':
      return await handlePullRequestEvent(payload)
    case 'push':
      return await handlePushEvent(payload)
    default:
      console.log(`Unhandled webhook event: ${event}`)
  }
}

async function handleIssueEvent(payload: any) {
  const { action, issue, repository } = payload
  
  // Update local track data if issue exists in our system
  const existingTrack = await getTrackByGitHubIssue(
    repository.owner.login,
    repository.name,
    issue.number
  )
  
  if (existingTrack) {
    await updateTrack(existingTrack.id, {
      title: issue.title,
      status: issue.state,
      description: issue.body
    })
  }
}
```

## Integration with Session Tracking

```typescript
// Link GitHub issues to sessions
export async function createSessionFromIssue(
  spaceId: string,
  issue: GitHubIssue
) {
  // First, create or update the track
  const track = await upsertTrack({
    space_id: spaceId,
    github_issue_number: issue.number,
    github_repo_owner: issue.repository.owner,
    github_repo_name: issue.repository.name,
    title: issue.title,
    description: issue.body,
    status: issue.state
  })
  
  // Then create the session
  return await createSession({
    space_id: spaceId,
    track_id: track.id,
    title: `Work on: ${issue.title}`,
    description: `GitHub Issue #${issue.number} from ${issue.repository.owner}/${issue.repository.name}`
  })
}

// Update session with GitHub context
export async function enrichSessionWithGitHub(session: Session) {
  if (!session.track_id) return session
  
  const track = await getTrack(session.track_id)
  if (!track.github_issue_number || !track.github_repo_owner || !track.github_repo_name) {
    return session
  }
  
  try {
    const issue = await getIssue(
      track.github_repo_owner,
      track.github_repo_name,
      track.github_issue_number
    )
    
    return {
      ...session,
      github_context: {
        issue,
        repository: {
          owner: track.github_repo_owner,
          name: track.github_repo_name
        }
      }
    }
  } catch (error) {
    console.error('Failed to enrich session with GitHub data:', error)
    return session
  }
}
```

## Best Practices

### Authentication
- Always check for valid tokens before API calls
- Handle token refresh gracefully
- Provide clear error messages for auth failures
- Respect OAuth scopes and permissions

### API Usage
- Implement proper rate limiting
- Use conditional requests with ETags when possible
- Batch operations to reduce API calls
- Cache frequently accessed data
- Handle network errors and retries

### Error Handling
- Provide user-friendly error messages
- Log detailed errors for debugging
- Implement fallback strategies
- Handle offline scenarios gracefully

### Security
- Validate webhook signatures
- Sanitize user inputs for search queries
- Don't expose sensitive GitHub tokens
- Follow principle of least privilege for OAuth scopes
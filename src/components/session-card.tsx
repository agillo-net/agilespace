import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Clock, GitBranch } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SessionCardProps {
  id: string
  github_issue_url: string
  started_at: string
  ended_at: string | null
  comment_url: string | null
  skipped_summary: boolean | null
  space_member?: {
    user_id: string
    profiles?: {
      full_name: string
      github_username: string
    }
  }
}

export function SessionCard({
  github_issue_url,
  started_at,
  ended_at,
  comment_url,
  skipped_summary,
  space_member,
}: SessionCardProps) {
  // Calculate duration
  const startTime = new Date(started_at)
  const endTime = ended_at ? new Date(ended_at) : new Date()
  const duration = endTime.getTime() - startTime.getTime()
  
  // Format duration
  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  // Extract issue info from URL
  const extractIssueInfo = (url: string) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/)
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        issueNumber: match[3],
        display: `${match[1]}/${match[2]}#${match[3]}`
      }
    }
    return { display: url }
  }

  const issueInfo = extractIssueInfo(github_issue_url)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            {issueInfo.display}
          </CardTitle>
          <a
            href={github_issue_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatDuration(duration)}</span>
          <span>•</span>
          <span>{formatDistanceToNow(startTime, { addSuffix: true })}</span>
        </div>
        
        {space_member?.profiles && (
          <div className="text-sm text-muted-foreground">
            by {space_member.profiles.full_name || space_member.profiles.github_username}
          </div>
        )}

        <div className="flex items-center gap-2">
          {ended_at ? (
            <Badge variant="secondary">Completed</Badge>
          ) : (
            <Badge variant="default">Active</Badge>
          )}
          
          {skipped_summary && (
            <Badge variant="outline">No Summary</Badge>
          )}
          
          {comment_url && (
            <a
              href={comment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              View Comment
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

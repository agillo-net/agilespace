import { formatDistanceToNow } from 'date-fns'
import type { Tag } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn, isLightColor, getGitHubIssueUrl } from '@/lib/utils'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface SessionCardProps {
    github_issue_url: string
    startedAt: string
    endedAt?: string
    duration?: string
    onEndSession?: () => void
    isEnding?: boolean
    commentUrl?: string
    skippedSummary?: boolean
    tags?: { tag: Tag }[]
    spaceMember?: {
        profile: {
            full_name: string | null
            avatar_url: string | null
        }
    }
}

export function getFormattedIssueInfo(githubIssueUrl: string) {
    const match = githubIssueUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (!match) throw "Invalid GitHub issue URL";
    const [, owner, repo, issueNumber] = match;
    return {
        owner,
        repo,
        issueNumber: parseInt(issueNumber, 10),
    };
}

export function SessionCard({
    github_issue_url,
    startedAt,
    endedAt,
    duration,
    onEndSession,
    isEnding,
    commentUrl,
    skippedSummary,
    tags,
    spaceMember
}: SessionCardProps) {
    const { owner, repo, issueNumber } = getFormattedIssueInfo(github_issue_url);
    if (!owner || !repo || !issueNumber) {
        return <div className="text-red-500">Invalid GitHub issue URL</div>;
    }  

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg gap-4">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <a
                        href={github_issue_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-blue-600 transition-colors"
                    >
                        Open GitHub Issue
                    </a>
                    {duration && (
                        <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                            {duration}
                        </span>
                    )}
                    {skippedSummary && (
                        <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-full">
                            Skipped Summary
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-500">
                            {owner}/{repo} #{issueNumber}
                        </p>
                        {spaceMember && spaceMember.profile && (
                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-pointer group">
                                        <Avatar className="h-7 w-7 ring-2 ring-offset-2 ring-gray-100 group-hover:ring-blue-100 transition-all">
                                            <AvatarImage src={spaceMember.profile.avatar_url || undefined} />
                                            <AvatarFallback className="bg-gray-100 text-gray-600">
                                                {spaceMember.profile.full_name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                            {spaceMember.profile.full_name || 'Unknown User'}
                                        </span>
                                    </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-gray-100">
                                            <AvatarImage src={spaceMember.profile.avatar_url || undefined} />
                                            <AvatarFallback className="bg-gray-100 text-gray-600 text-lg">
                                                {spaceMember.profile.full_name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <p className="font-medium text-gray-900">{spaceMember.profile.full_name || 'Unknown User'}</p>
                                            <p className="text-sm text-gray-500">Session Owner</p>
                                        </div>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        {endedAt
                            ? `Ended ${formatDistanceToNow(new Date(endedAt), { addSuffix: true })}`
                            : `Started ${formatDistanceToNow(new Date(startedAt), { addSuffix: true })}`}
                    </p>
                </div>
                {commentUrl && (
                    <a
                        href={commentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        View Session Summary
                    </a>
                )}
                {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map(({ tag }) => (
                            <Badge
                                key={tag.id}
                                variant="outline"
                                className={cn(
                                    "border-0",
                                    tag.color && isLightColor(tag.color) ? "text-gray-900" : "text-white"
                                )}
                                style={{ backgroundColor: tag.color || undefined }}
                            >
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-4">
                {onEndSession && (
                    <button
                        onClick={onEndSession}
                        disabled={isEnding}
                        className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {isEnding ? 'Ending...' : 'End Session'}
                    </button>
                )}
            </div>
        </div>
    )
} 

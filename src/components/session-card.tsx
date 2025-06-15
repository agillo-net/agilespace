import { formatDistanceToNow } from 'date-fns'
import type { Track, Tag } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn, isLightColor, getGitHubIssueUrl } from '@/lib/utils'

interface SessionCardProps {
    track: Track
    startedAt: string
    endedAt?: string
    duration?: string
    onEndSession?: () => void
    isEnding?: boolean
    commentUrl?: string
    skippedSummary?: boolean
    tags?: { tag: Tag }[]
}

export function SessionCard({
    track,
    startedAt,
    endedAt,
    duration,
    onEndSession,
    isEnding,
    commentUrl,
    skippedSummary,
    tags
}: SessionCardProps) {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg gap-4">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium">{track.title}</h3>
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
                <p className="text-sm text-gray-500">
                    {track.repo_owner}/{track.repo_name} #{track.issue_number}
                </p>
                <p className="text-sm text-gray-500">
                    {endedAt
                        ? `Ended ${formatDistanceToNow(new Date(endedAt), { addSuffix: true })}`
                        : `Started ${formatDistanceToNow(new Date(startedAt), { addSuffix: true })}`}
                </p>
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
                <a
                    href={getGitHubIssueUrl(track)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
                >
                    View on GitHub
                </a>
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

import { formatDistanceToNow } from 'date-fns'
import type { Track, Tag } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn, isLightColor, getGitHubIssueUrl } from '@/lib/utils'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Play, Trash2, Clock } from 'lucide-react'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface SessionCardProps {
    track: Track
    startedAt: string
    endedAt?: string
    duration?: string
    onEndSession?: () => void
    onDiscardSession?: () => void
    onStartSession?: (trackId: string) => void
    onRequestDurationChange?: () => void
    isEnding?: boolean
    isDiscarding?: boolean
    isStarting?: boolean
    hasActiveSession?: boolean
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

export function SessionCard({
    track,
    startedAt,
    endedAt,
    duration,
    onEndSession,
    onDiscardSession,
    onStartSession,
    onRequestDurationChange,
    isEnding,
    isDiscarding,
    isStarting,
    hasActiveSession,
    commentUrl,
    skippedSummary,
    tags,
    spaceMember
}: SessionCardProps) {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg gap-4">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <a
                        href={getGitHubIssueUrl(track)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-blue-600 transition-colors"
                    >
                        {track.title}
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
                            {track.repo_owner}/{track.repo_name} #{track.issue_number}
                        </p>
                        {spaceMember && spaceMember.profile && (
                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <div className="flex items-center gap-2 group">
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
                        disabled={isEnding || isDiscarding}
                        className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isEnding ? 'Ending...' : 'End Session'}
                    </button>
                )}
                {onDiscardSession && (
                    <button
                        onClick={onDiscardSession}
                        disabled={isEnding || isDiscarding}
                        className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Discard Session"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                )}
                {endedAt && onRequestDurationChange && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={onRequestDurationChange}
                                    size="icon"
                                    variant="ghost"
                                >
                                    <Clock className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Request Duration Change</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                {endedAt && onStartSession && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => onStartSession(track.id)}
                                    disabled={isStarting || hasActiveSession}
                                    size="icon"
                                    variant="ghost"
                                >
                                    <Play className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Start New Session</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        </div>
    )
} 

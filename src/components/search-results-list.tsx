import type { GitHubIssue } from '@/types'
import { IssueDetailsDialog } from './issue-details-dialog'
import { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { getTextColorForBackground } from "@/lib/utils"

import type { Track, ActiveSession, Tag } from '@/types'
import type { UseMutationResult } from '@tanstack/react-query'

interface SearchResultsListProps {
    searchResults: GitHubIssue[]
    getTrackForIssue: (issue: GitHubIssue) => Track | null
    handleCreateTrack: (issue: GitHubIssue) => void
    handleStartSession: (trackId: string) => void
    activeSession: ActiveSession | null
    startSessionMutation: UseMutationResult<unknown, unknown, string>
    endSessionMutation: UseMutationResult<
        unknown,
        unknown,
        {
            sessionId: string
            message: string
            skipSummary: boolean
            selectedTags: Tag[]
        }
    >
    setShowEndSessionDialog: (show: boolean) => void
    isCurrentSessionTrack: (trackId: string) => boolean
    getSessionCount: (trackId: string) => number
    getTotalDuration: (trackId: string) => string
}

export function SearchResultsList({
    searchResults,
    getTrackForIssue,
    handleCreateTrack,
    handleStartSession,
    activeSession,
    startSessionMutation,
    endSessionMutation,
    setShowEndSessionDialog,
    isCurrentSessionTrack,
    getSessionCount,
    getTotalDuration
}: SearchResultsListProps) {
    const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null)
    const [isIssueDialogOpen, setIssueDialogOpen] = useState(false)

    const handleIssueClick = (issue: GitHubIssue) => {
        setSelectedIssue(issue)
        setIssueDialogOpen(true)
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            <div className="space-y-4">
                {searchResults.map((issue) => {
                    const track = getTrackForIssue(issue)
                    return (
                        <div
                            key={issue.id}
                            className="flex items-center justify-between p-4 border rounded-lg gap-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleIssueClick(issue)}
                        >
                            <div className="flex-1">
                                <h3 className="font-medium">{issue.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">
                                    {issue.repository.name} #{issue.number}
                                </p>

                                <div className="flex flex-wrap gap-2 mt-2">
                                    {issue.labels?.map(
                                        (label) =>
                                            label.name && (
                                                <span
                                                    key={label.id}
                                                    className="px-2 py-1 text-xs font-semibold rounded-full"
                                                    style={{
                                                        backgroundColor: `#${label.color}`,
                                                        color: getTextColorForBackground(label.color)
                                                    }}
                                                >
                                                    {label.name}
                                                </span>
                                            )
                                    )}
                                </div>
                                {issue.assignees && issue.assignees.length > 0 && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-sm text-gray-500">Assignees:</span>
                                        {issue.assignees.map(
                                            (assignee) =>
                                                assignee && (
                                                    <a
                                                        key={assignee.id}
                                                        href={assignee.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title={assignee.login}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={assignee.avatar_url} />
                                                            <AvatarFallback>
                                                                {assignee.login?.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </a>
                                                )
                                        )}
                                    </div>
                                )}
                            </div>
                            {track ? (
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-full">
                                            {getSessionCount(track.id)} Sessions
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Total time: {getTotalDuration(track.id)}
                                        </span>
                                    </div>
                                    {isCurrentSessionTrack(track.id) ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowEndSessionDialog(true)
                                            }}
                                            disabled={endSessionMutation.isPending}
                                            className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {endSessionMutation.isPending ? 'Ending...' : 'End Session'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleStartSession(track.id)
                                            }}
                                            disabled={!!activeSession || startSessionMutation.isPending}
                                            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {activeSession ? 'End Current Session First' : startSessionMutation.isPending ? 'Starting...' : 'Start New Session'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleCreateTrack(issue)
                                    }}
                                    disabled={!!activeSession || startSessionMutation.isPending}
                                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                                >
                                    {activeSession ? 'End Current Session First' : startSessionMutation.isPending ? 'Starting...' : 'Start Session'}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
            <IssueDetailsDialog
                issue={selectedIssue}
                isOpen={isIssueDialogOpen}
                onOpenChange={setIssueDialogOpen}
            />
        </div>
    )
} 

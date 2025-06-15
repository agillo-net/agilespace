import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSpaceAndTracks, getClosedSessions, getActiveSession, getTrackSessionStats } from '@/lib/supabase/queries'
import { searchIssues } from '@/lib/github/queries'
import type { GitHubIssue, Tag } from '@/types'
import { useDebounce } from '@/hooks/use-debounce'
import { createTrack, createSession, endSession, linkTagToSession } from '@/lib/supabase/mutations'
import { toast } from 'sonner'
import { createIssueComment } from '@/lib/github/mutations'
import { EndSessionDialog } from '@/components/end-session-dialog'
import { SearchForm } from '@/components/search-form'
import { SessionCard } from '@/components/session-card'
import { formatTime, getSessionDuration } from '@/lib/utils'
import { formatSessionComment } from '@/lib/utils'

export const Route = createFileRoute('/space/$slug/sessions/')({
    component: SessionsPage,
    loader: async ({ params: { slug } }) => {
        return getSpaceAndTracks(slug)
    }
})

function SessionsPage() {
    const { slug } = Route.useParams()
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearchQuery = useDebounce(searchQuery, 500)
    const [showEndSessionDialog, setShowEndSessionDialog] = useState(false)
    const [endSessionMessage, setEndSessionMessage] = useState('')
    const queryClient = useQueryClient()

    // Load space and tracks data
    const { data: spaceData, isLoading: isLoadingSpace } = useQuery({
        queryKey: ['space', slug],
        queryFn: () => getSpaceAndTracks(slug)
    })

    // Load closed sessions
    const { data: closedSessions, isLoading: isLoadingSessions } = useQuery({
        queryKey: ['closedSessions', spaceData?.space?.id],
        queryFn: () => getClosedSessions(spaceData?.space?.id || ''),
        enabled: !!spaceData?.space?.id
    })

    // Load active session
    const { data: activeSession } = useQuery({
        queryKey: ['activeSession', slug],
        queryFn: () => getActiveSession(),
        enabled: !!slug
    })

    // Search issues
    const {
        data: searchResults,
        isLoading: isSearching,
        refetch: refetchSearch,
        error: searchError
    } = useQuery({
        queryKey: ['issues', slug, debouncedSearchQuery],
        queryFn: () => searchIssues(slug, debouncedSearchQuery),
        enabled: !!debouncedSearchQuery.trim(),
        retry: false
    })

    // Load session stats for tracks
    const { data: sessionStats } = useQuery({
        queryKey: ['sessionStats', spaceData?.tracks?.map(t => t.id)],
        queryFn: () => getTrackSessionStats(spaceData?.tracks?.map(t => t.id) || []),
        enabled: !!spaceData?.tracks?.length
    })

    // End session mutation
    const endSessionMutation = useMutation({
        mutationFn: async ({ sessionId, message, skipSummary, selectedTags }: { sessionId: string, message: string, skipSummary: boolean, selectedTags: Tag[] }) => {
            if (!activeSession?.track) throw new Error("No active track found")

            let commentUrl: string | undefined
            if (!skipSummary) {
                // Create GitHub issue comment
                const response = await createIssueComment({
                    owner: activeSession.track.repo_owner,
                    repo: activeSession.track.repo_name,
                    issue_number: activeSession.track.issue_number,
                    body: formatSessionComment(
                        new Date().getTime() - new Date(activeSession.started_at).getTime(),
                        message,
                    )
                })
                commentUrl = response.html_url
            }

            // End the session and link tags
            await endSession(sessionId, commentUrl, skipSummary)

            // Link selected tags to the session
            for (const tag of selectedTags) {
                await linkTagToSession(sessionId, tag.id)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeSession', slug] })
            queryClient.invalidateQueries({ queryKey: ['closedSessions', spaceData?.space?.id] })
            queryClient.invalidateQueries({ queryKey: ['issues', slug, debouncedSearchQuery] })
            setShowEndSessionDialog(false)
            setEndSessionMessage('')
            toast.success("Session ended successfully")
        },
        onError: (error) => {
            toast.error(`Failed to end session: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    })

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return
        refetchSearch()
    }

    const handleCreateTrack = async (issue: GitHubIssue) => {
        if (!spaceData?.space || !spaceData?.space_member) return
        try {
            const track = await createTrack({
                space_id: spaceData.space.id,
                repo_owner: issue.repository.owner || '',
                repo_name: issue.repository.name || '',
                issue_number: issue.number,
                title: issue.title,
            })
            await createSession({
                track_id: track.id,
                space_member_id: spaceData.space_member.id,
            })
            // Clear search results
            setSearchQuery('')
            queryClient.invalidateQueries({ queryKey: ['activeSession', slug] })
            toast.success("Track created and session started")
        } catch (error) {
            toast.error(`Failed to create track: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    const handleEndSession = (skipSummary: boolean, selectedTags: Tag[]) => {
        if (activeSession && (endSessionMessage.trim() || skipSummary)) {
            endSessionMutation.mutate({
                sessionId: activeSession.id,
                message: endSessionMessage.trim(),
                skipSummary,
                selectedTags
            })
        }
    }

    const getSessionCount = (trackId: string) => {
        if (!sessionStats) return 0
        return sessionStats.counts[trackId] || 0
    }

    const handleStartSession = async (trackId: string) => {
        if (!spaceData?.space_member) return
        try {
            await createSession({
                track_id: trackId,
                space_member_id: spaceData.space_member.id,
            })
            // Clear search results
            setSearchQuery('')
            queryClient.invalidateQueries({ queryKey: ['activeSession', slug] })
            toast.success("Session started successfully")
        } catch (error) {
            toast.error(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    const getTrackForIssue = (issue: GitHubIssue) => {
        if (!spaceData?.tracks) return null
        return spaceData.tracks.find(
            track =>
                track.repo_owner === issue.repository.owner &&
                track.repo_name === issue.repository.name &&
                track.issue_number === issue.number
        )
    }

    const getTotalDuration = (trackId: string) => {
        if (!sessionStats) return '0h 0m'
        const duration = sessionStats.durations[trackId] || 0
        return formatTime(duration)
    }

    const isCurrentSessionTrack = (trackId: string) => {
        return activeSession?.track.id === trackId
    }

    if (isLoadingSpace || isLoadingSessions) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Sessions for {slug}</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">Loading sessions...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Sessions</h1>

            {/* Active Session */}
            {activeSession && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Active Session</h2>
                    <SessionCard
                        track={activeSession.track}
                        startedAt={activeSession.started_at}
                        onEndSession={() => setShowEndSessionDialog(true)}
                        isEnding={endSessionMutation.isPending}
                    />
                </div>
            )}

            {/* Search Form */}
            <SearchForm
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSubmit={handleSearch}
                isSearching={isSearching}
                isDisabled={!!activeSession}
            />

            {/* Search Error */}
            {searchError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">
                        {searchError instanceof Error
                            ? searchError.message
                            : 'Failed to search issues. Please try again.'}
                    </p>
                </div>
            )}

            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Search Results</h2>
                    <div className="space-y-4">
                        {searchResults.map((issue) => {
                            const track = getTrackForIssue(issue)
                            return (
                                <div
                                    key={issue.id}
                                    className="flex items-center justify-between p-4 border rounded-lg gap-4"
                                >
                                    <div>
                                        <h3 className="font-medium">{issue.title}</h3>
                                        <p className="text-sm text-gray-500">
                                            {issue.repository.name} #{issue.number}
                                        </p>
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
                                                    onClick={() => setShowEndSessionDialog(true)}
                                                    disabled={endSessionMutation.isPending}
                                                    className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    {endSessionMutation.isPending ? 'Ending...' : 'End Session'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleStartSession(track.id)}
                                                    disabled={!!activeSession}
                                                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    {activeSession ? 'End Current Session First' : 'Start New Session'}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleCreateTrack(issue)}
                                            disabled={!!activeSession}
                                            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {activeSession ? 'End Current Session First' : 'Start Session'}
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Closed Sessions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Closed Sessions</h2>
                <div className="space-y-4">
                    {closedSessions && closedSessions.length > 0 ? (
                        closedSessions.map((session) => (
                            <SessionCard
                                key={session.id}
                                track={session.track}
                                startedAt={session.started_at}
                                endedAt={session.ended_at}
                                duration={getSessionDuration(session.started_at, session.ended_at!)}
                                commentUrl={session.comment_url}
                                skippedSummary={session.skipped_summary}
                                tags={session.tags}
                            />
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-4">
                            No closed sessions found.
                        </p>
                    )}
                </div>
            </div>

            {/* End Session Dialog */}
            <EndSessionDialog
                open={showEndSessionDialog}
                onOpenChange={setShowEndSessionDialog}
                message={endSessionMessage}
                onMessageChange={setEndSessionMessage}
                onEndSession={handleEndSession}
                isPending={endSessionMutation.isPending}
                spaceId={spaceData?.space?.id || ''}
            />
        </div>
    )
} 

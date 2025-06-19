import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSpaceAndTracks, getClosedSessions, getActiveSession, getTrackSessionStats } from '@/lib/supabase/queries'
import { searchIssues } from '@/lib/github/queries'
import type { GitHubIssue, Tag } from '@/types'
import { useDebounce } from '@/hooks/use-debounce'
import { createTrack, createSession, endSession, linkTagToSession, deleteSession } from '@/lib/supabase/mutations'
import { toast } from 'sonner'
import { createIssueComment } from '@/lib/github/mutations'
import { EndSessionDialog } from '@/components/end-session-dialog'
import { DiscardSessionDialog } from '@/components/discard-session-dialog'
import { SearchForm } from '@/components/search-form'
import { SessionCard } from '@/components/session-card'
import { formatTime, getSessionDuration } from '@/lib/utils'
import { formatSessionComment } from '@/lib/utils'
import { DEBOUNCE_TIME } from '@/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import React from 'react'
import { MultiSelect } from '@/components/ui/multi-select'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/space/$slug/sessions/')({
    component: SessionsPage,
    loader: async ({ params: { slug } }) => {
        return getSpaceAndTracks(slug)
    }
})

function SessionsPage() {
    const { slug } = Route.useParams()
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearchQuery, setValue] = useDebounce(searchQuery, DEBOUNCE_TIME)
    const [showEndSessionDialog, setShowEndSessionDialog] = useState(false)
    const [showDiscardDialog, setShowDiscardDialog] = useState(false)
    const [endSessionMessage, setEndSessionMessage] = useState('')
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [timeFilter, setTimeFilter] = useState<'all' | 'day' | 'week'>('all')
    const [sessionLimit, setSessionLimit] = useState<number>(10)
    const queryClient = useQueryClient()
    const { user } = useAuth()

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
        error: searchError
    } = useQuery({
        queryKey: ['sessions', 'issues', slug, debouncedSearchQuery],
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

            // Calculate duration using proper Date objects
            const startDate = new Date(activeSession.started_at)
            const endDate = new Date()
            const duration = endDate.getTime() - startDate.getTime()

            let commentUrl: string | undefined
            if (!skipSummary) {
                // Create GitHub issue comment
                const response = await createIssueComment({
                    owner: activeSession.track.repo_owner,
                    repo: activeSession.track.repo_name,
                    issue_number: activeSession.track.issue_number,
                    body: formatSessionComment(
                        duration,
                        message,
                    )
                })
                commentUrl = response.html_url
            }

            // End the session and link tags
            await endSession(sessionId, commentUrl, skipSummary, endDate.toISOString())

            // Link selected tags to the session
            for (const tag of selectedTags) {
                await linkTagToSession(sessionId, tag.id)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeSession', slug] })
            queryClient.invalidateQueries({ queryKey: ['closedSessions', spaceData?.space?.id] })
            setShowEndSessionDialog(false)
            setEndSessionMessage('')
            toast.success("Session ended successfully")
        },
        onError: (error) => {
            toast.error(`Failed to end session: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    })

    // Discard session mutation
    const discardSessionMutation = useMutation({
        mutationFn: async ({ sessionId }: { sessionId: string }) => {
            await deleteSession(sessionId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeSession', slug] })
            queryClient.invalidateQueries({ queryKey: ['closedSessions', spaceData?.space?.id] })
            setShowDiscardDialog(false)
            toast.success("Session discarded successfully")
        },
        onError: (error) => {
            toast.error(`Failed to discard session: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    })

    // Add mutation for starting a session
    const startSessionMutation = useMutation({
        mutationFn: async (trackId: string) => {
            if (!spaceData?.space_member) return
            await createSession({
                track_id: trackId,
                space_member_id: spaceData.space_member.id,
            })
        },
        onSuccess: () => {
            setSearchQuery('')
            queryClient.invalidateQueries({ queryKey: ['activeSession', slug] })
            toast.success("Session started successfully")
        },
        onError: (error) => {
            toast.error(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    })

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return
        setValue(searchQuery, true)
    }

    const handleCreateTrack = async (issue: GitHubIssue) => {
        if (!spaceData?.space || !spaceData?.space_member) return
        try {
            // Check if track already exists
            const existingTrack = getTrackForIssue(issue)
            let trackId: string
            if (existingTrack) {
                trackId = existingTrack.id
            } else {
                const track = await createTrack({
                    space_id: spaceData.space.id,
                    repo_owner: issue.repository.owner || '',
                    repo_name: issue.repository.name || '',
                    issue_number: issue.number,
                    title: issue.title,
                })
                trackId = track.id
            }
            await createSession({
                track_id: trackId,
                space_member_id: spaceData.space_member.id,
            })
            // Clear search results
            queryClient.invalidateQueries({ queryKey: ['space', slug] })
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

    const handleDiscardSession = () => {
        if (activeSession) {
            discardSessionMutation.mutate({ sessionId: activeSession.id })
        }
    }

    const getSessionCount = (trackId: string) => {
        if (!sessionStats) return 0
        return sessionStats.counts[trackId] || 0
    }

    // Replace handleStartSession with mutation logic
    const handleStartSession = (trackId: string) => {
        if (!activeSession && !startSessionMutation.isPending) {
            startSessionMutation.mutate(trackId)
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

    // Filter closed sessions based on selected filters
    const filteredClosedSessions = React.useMemo(() => {
        if (!closedSessions) return []

        let filtered = [...closedSessions]

        // Filter by members
        if (selectedMembers.length > 0) {
            filtered = filtered.filter(session =>
                session.space_member?.user_id && selectedMembers.includes(session.space_member.user_id)
            )
        }

        // Filter by time period
        const now = new Date()
        if (timeFilter === 'day') {
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            filtered = filtered.filter(session =>
                new Date(session.ended_at!) >= oneDayAgo
            )
        } else if (timeFilter === 'week') {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            filtered = filtered.filter(session =>
                new Date(session.ended_at!) >= oneWeekAgo
            )
        }

        // Apply limit
        return filtered.slice(0, sessionLimit)
    }, [closedSessions, selectedMembers, timeFilter, sessionLimit])

    // Get unique members from closed sessions
    const uniqueMembers = React.useMemo(() => {
        if (!closedSessions) return []
        const members = new Map()
        closedSessions.forEach(session => {
            if (session.space_member?.user_id && session.space_member?.profile) {
                members.set(session.space_member.user_id, session.space_member.profile)
            }
        })
        return Array.from(members.entries())
    }, [closedSessions])

    // Prepare member options for MultiSelect
    const memberOptions = React.useMemo(() => {
        // Sort members to put current user first
        const sortedMembers = [...uniqueMembers].sort(([idA], [idB]) => {
            if (idA === user?.id) return -1
            if (idB === user?.id) return 1
            return 0
        })

        return sortedMembers.map(([id, profile]) => ({
            label: `${profile.full_name || 'Unknown User'}${id === user?.id ? ' (Me)' : ''}`,
            value: id,
            icon: () => (
                <Avatar className="h-4 w-4">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                        {profile.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                </Avatar>
            )
        }))
    }, [uniqueMembers, user?.id])

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
                        onDiscardSession={() => setShowDiscardDialog(true)}
                        isEnding={endSessionMutation.isPending}
                        isDiscarding={discardSessionMutation.isPending}
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
                error={searchError}
            />

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
                                                    disabled={!!activeSession || startSessionMutation.isPending}
                                                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    {activeSession ? 'End Current Session First' : startSessionMutation.isPending ? 'Starting...' : 'Start New Session'}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleCreateTrack(issue)}
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
                </div>
            )}

            {/* Closed Sessions */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Closed Sessions</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="member-filter">Members:</Label>
                            <MultiSelect
                                options={memberOptions}
                                value={selectedMembers}
                                onValueChange={setSelectedMembers}
                                placeholder="Select members"
                                maxCount={3}
                                className="w-[300px]"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="time-filter">Time Period:</Label>
                            <Select value={timeFilter} onValueChange={(value: 'all' | 'day' | 'week') => setTimeFilter(value)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select time period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="day">Last 24 Hours</SelectItem>
                                    <SelectItem value="week">Last 7 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="session-limit">Limit:</Label>
                            <Input
                                id="session-limit"
                                type="number"
                                min="1"
                                max="100"
                                value={sessionLimit}
                                onChange={(e) => setSessionLimit(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
                                className="w-[100px]"
                            />
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    {filteredClosedSessions.length > 0 ? (
                        filteredClosedSessions.map((session) => (
                            <SessionCard
                                key={session.id}
                                track={session.track}
                                startedAt={session.started_at}
                                endedAt={session.ended_at}
                                duration={getSessionDuration(session.started_at, session.ended_at!)}
                                commentUrl={session.comment_url}
                                skippedSummary={session.skipped_summary}
                                tags={session.tags}
                                spaceMember={session.space_member}
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

            {/* Discard Session Dialog */}
            <DiscardSessionDialog
                open={showDiscardDialog}
                onOpenChange={setShowDiscardDialog}
                onConfirm={handleDiscardSession}
                isPending={discardSessionMutation.isPending}
            />
        </div>
    )
} 

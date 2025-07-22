import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getSpaceAndTracks } from '@/lib/supabase/queries'
import { EndSessionDialog } from '@/components/end-session-dialog'
import { DiscardSessionDialog } from '@/components/discard-session-dialog'
import { RequestDurationChangeDialog } from '@/components/request-duration-change-dialog'
import { SearchForm } from '@/components/search-form'
import { SessionCard } from '@/components/session-card'
import { getSessionDuration } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { SearchableSelect } from '@/components/ui/searchable-select'
import React from 'react'
import { MultiSelect } from '@/components/ui/multi-select'
import { useAuth } from '@/hooks/api/use-auth'
import { useSessions } from '@/hooks/api/use-sessions'
import { useSessionChangeRequests } from '@/hooks/api/use-session-change-requests'
import { SearchResultsList } from '@/components/search-results-list'

export const Route = createFileRoute('/space/$slug/sessions/')({
    component: SessionsPage,
    validateSearch: (search: Record<string, unknown>) => ({
        track: (search.track as string) || null
    }),
    loader: async ({ params: { slug } }) => {
        return getSpaceAndTracks(slug)
    }
})

function SessionsPage() {
    const { slug } = Route.useParams()
    const search = Route.useSearch()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [showDurationChangeDialog, setShowDurationChangeDialog] = React.useState(false)
    const [selectedSessionForChange, setSelectedSessionForChange] = React.useState<any>(null)
    const {
        searchQuery,
        setSearchQuery,
        showEndSessionDialog,
        setShowEndSessionDialog,
        showDiscardDialog,
        setShowDiscardDialog,
        endSessionMessage,
        setEndSessionMessage,
        selectedMembers,
        setSelectedMembers,
        timeFilter,
        setTimeFilter,
        sessionLimit,
        setSessionLimit,
        selectedTrack,
        setSelectedTrack,
        spaceData,
        isLoadingSpace,
        closedSessions,
        isLoadingSessions,
        activeSession,
        searchResults,
        isSearching,
        searchError,
        endSessionMutation,
        discardSessionMutation,
        handleSearch,
        handleCreateTrackAndStartSession,
        handleEndSession,
        handleDiscardSession,
        getSessionCount,
        handleStartSession,
        getTrackForIssue,
        getTotalDuration,
        isCurrentSessionTrack,
        startSessionMutation
    } = useSessions(slug, search.track)

    const { createRequest: createChangeRequest, isCreating } = useSessionChangeRequests(spaceData?.space?.id || '')

    const handleRequestDurationChange = (session: any) => {
        setSelectedSessionForChange(session)
        setShowDurationChangeDialog(true)
    }

    const handleSubmitDurationChangeRequest = async (data: {
        requestedStartedAt: string
        requestedEndedAt: string | null
        reason: string
    }) => {
        if (!selectedSessionForChange) return

        try {
            await createChangeRequest({
                sessionId: selectedSessionForChange.id,
                originalStartedAt: selectedSessionForChange.started_at,
                originalEndedAt: selectedSessionForChange.ended_at,
                requestedStartedAt: data.requestedStartedAt,
                requestedEndedAt: data.requestedEndedAt,
                reason: data.reason
            })
            setShowDurationChangeDialog(false)
            setSelectedSessionForChange(null)
        } catch (error) {
            console.error('Failed to submit duration change request:', error)
        }
    }

    const filteredAndSortedSessions = React.useMemo(() => {
        if (!closedSessions) return []

        let filtered = [...closedSessions]

        // Filter by time
        const now = new Date()
        if (timeFilter === 'day') {
            filtered = filtered.filter(s => new Date(s.ended_at!) > new Date(now.getTime() - 24 * 60 * 60 * 1000))
        } else if (timeFilter === 'week') {
            filtered = filtered.filter(s => new Date(s.ended_at!) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
        }

        // Filter by member
        if (selectedMembers.length > 0) {
            filtered = filtered.filter(s => s.space_member?.user_id && selectedMembers.includes(s.space_member.user_id))
        }

        // Filter by track
        if (selectedTrack) {
            filtered = filtered.filter(s => s.track?.id === selectedTrack)
        }

        // Sort by ended_at
        return filtered.sort((a, b) => new Date(b.ended_at!).getTime() - new Date(a.ended_at!).getTime())
    }, [closedSessions, timeFilter, selectedMembers, selectedTrack])

    // Get unique members from all sessions for the filter dropdown
    const uniqueMembers = React.useMemo(() => {
        if (!closedSessions) return new Map()
        const memberMap = new Map<string, { full_name: string | null; avatar_url: string | null }>()
        closedSessions.forEach(session => {
            if (session.space_member && session.space_member.profile && session.space_member.user_id) {
                memberMap.set(session.space_member.user_id, session.space_member.profile)
            }
        })
        return memberMap
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

    // Prepare track options for SearchableSelect
    const trackOptions = React.useMemo(() => {
        return (spaceData?.tracks || []).map(track => ({
            value: track.id,
            label: track.title || 'Untitled',
            subtitle: `${track.repo_owner}/${track.repo_name} #${track.issue_number}`
        }))
    }, [spaceData?.tracks])

    // Handle track filter changes with URL navigation
    const handleTrackFilterChange = (trackId: string | null) => {
        setSelectedTrack(trackId)
        navigate({
            to: '/space/$slug/sessions',
            params: { slug },
            search: { track: trackId },
            replace: true
        })
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
                        spaceMember={activeSession.space_member && activeSession.space_member.profile ? { profile: activeSession.space_member.profile } : undefined}
                    />
                </div>
            )}

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
                <SearchResultsList
                    searchResults={searchResults}
                    getTrackForIssue={getTrackForIssue}
                    handleCreateTrack={handleCreateTrackAndStartSession}
                    handleStartSession={handleStartSession}
                    activeSession={activeSession}
                    startSessionMutation={startSessionMutation}
                    endSessionMutation={endSessionMutation}
                    setShowEndSessionDialog={setShowEndSessionDialog}
                    isCurrentSessionTrack={isCurrentSessionTrack}
                    getSessionCount={getSessionCount}
                    getTotalDuration={getTotalDuration}
                />
            )}

            {/* Closed Sessions */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Completed Sessions</h2>
                    <div className="flex items-center gap-4">
                        <div className="min-w-[200px]">
                            <Label htmlFor="track-filter" className="sr-only">Track</Label>
                            <SearchableSelect
                                options={trackOptions}
                                value={selectedTrack}
                                onValueChange={handleTrackFilterChange}
                                placeholder="Select track"
                                searchPlaceholder="Search tracks..."
                                clearText="All tracks"
                                className="w-full"
                            />
                        </div>
                        <div className="min-w-[200px]">
                            <Label htmlFor="member-filter" className="sr-only">Member</Label>
                            <MultiSelect
                                options={memberOptions}
                                onValueChange={setSelectedMembers}
                                placeholder="Select members"
                                className="w-full"
                                defaultValue={selectedMembers}
                            />
                        </div>
                        <div>
                            <Label htmlFor="time-filter" className="sr-only">Time</Label>
                            <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as 'all' | 'day' | 'week')}>
                                <SelectTrigger id="time-filter" className="w-[120px]">
                                    <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All time</SelectItem>
                                    <SelectItem value="day">Last 24h</SelectItem>
                                    <SelectItem value="week">Last 7d</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="limit-filter" className="sr-only">Show</Label>
                            <Input
                                id="limit-filter"
                                type="number"
                                min="1"
                                value={sessionLimit}
                                onChange={(e) => setSessionLimit(Number(e.target.value))}
                                className="w-[80px]"
                            />
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    {filteredAndSortedSessions.slice(0, sessionLimit).map(session => (
                        <SessionCard
                            key={session.id}
                            track={session.track}
                            startedAt={session.started_at}
                            endedAt={session.ended_at || undefined}
                            duration={getSessionDuration(session.started_at, session.ended_at!)}
                            commentUrl={session.comment_url || undefined}
                            skippedSummary={session.skipped_summary || false}
                            tags={session.tags}
                            spaceMember={session.space_member && session.space_member.profile ? { profile: session.space_member.profile } : undefined}
                            onStartSession={handleStartSession}
                            onRequestDurationChange={() => handleRequestDurationChange(session)}
                            isStarting={startSessionMutation.isPending}
                            hasActiveSession={!!activeSession}
                        />
                    ))}
                    {filteredAndSortedSessions.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No completed sessions found.</p>
                    )}
                </div>
            </div>

            {activeSession && (
                <>
                    <EndSessionDialog
                        open={showEndSessionDialog}
                        onOpenChange={setShowEndSessionDialog}
                        onEndSession={handleEndSession}
                        message={endSessionMessage}
                        onMessageChange={setEndSessionMessage}
                        isPending={endSessionMutation.isPending}
                        spaceId={spaceData?.space?.id || ''}
                    />
                    <DiscardSessionDialog
                        open={showDiscardDialog}
                        onOpenChange={setShowDiscardDialog}
                        onConfirm={handleDiscardSession}
                        isPending={discardSessionMutation.isPending}
                    />
                </>
            )}
            
            <RequestDurationChangeDialog
                open={showDurationChangeDialog}
                onOpenChange={setShowDurationChangeDialog}
                session={selectedSessionForChange}
                onSubmit={handleSubmitDurationChangeRequest}
                isPending={isCreating}
            />
        </div>
    )
} 

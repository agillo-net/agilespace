import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserMemberSpace, getClosedSessions, getActiveSession, getIssueSessionStats } from '@/lib/supabase/queries'
import { searchIssues } from '@/lib/github/queries'
import type { GitHubIssue, Tag } from '@/types'
import { useDebounce } from '@/hooks/use-debounce'
import { createSession, endSession, linkTagToSession } from '@/lib/supabase/mutations'
import { toast } from 'sonner'
import { createIssueComment } from '@/lib/github/mutations'
import { EndSessionDialog } from '@/components/end-session-dialog'
import { SessionCard } from '@/components/session-card'
import { formatTime, getSessionDuration } from '@/lib/utils'
import { formatSessionComment } from '@/lib/utils'
import { DEBOUNCE_TIME } from '@/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

export const Route = createFileRoute('/space/$slug/sessions/')({
    component: SessionsPage,
    loader: async ({ params: { slug } }) => {
        return getUserMemberSpace(slug)
    }
})

function SessionsPage() {
    const { slug } = Route.useParams()
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearchQuery, setValue] = useDebounce(searchQuery, DEBOUNCE_TIME)
    const [showEndSessionDialog, setShowEndSessionDialog] = useState(false)
    const [endSessionMessage, setEndSessionMessage] = useState('')
    const [timeFilter, setTimeFilter] = useState<'all' | 'day' | 'week'>('all')
    const [sessionLimit, setSessionLimit] = useState<number>(10)
    const queryClient = useQueryClient()

    // Load space and member data
    const { data: spaceData, isLoading: isLoadingSpace } = useQuery({
        queryKey: ['space', slug],
        queryFn: () => getUserMemberSpace(slug)
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

    // Get unique issue URLs from closed sessions to fetch stats
    const issueUrls = React.useMemo(() => {
        if (!closedSessions) return []
        return [...new Set(closedSessions.map(session => session.github_issue_url))]
    }, [closedSessions])

    // Load session stats for issue URLs
    const { data: sessionStats } = useQuery({
        queryKey: ['sessionStats', issueUrls],
        queryFn: () => getIssueSessionStats(issueUrls),
        enabled: issueUrls.length > 0
    })

    // Helper function to extract issue info from GitHub issue URL
    const extractIssueInfo = (url: string) => {
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/)
        if (match) {
            return {
                owner: match[1],
                repo: match[2],
                issueNumber: parseInt(match[3])
            }
        }
        return null
    }

    // End session mutation
    const endSessionMutation = useMutation({
        mutationFn: async ({ sessionId, message, skipSummary, selectedTags }: { sessionId: string, message: string, skipSummary: boolean, selectedTags: Tag[] }) => {
            if (!activeSession?.github_issue_url) throw new Error("No active issue found")

            // Calculate duration using proper Date objects
            const startDate = new Date(activeSession.started_at)
            const endDate = new Date()
            const duration = endDate.getTime() - startDate.getTime()

            let commentUrl: string | undefined
            if (!skipSummary) {
                const issueInfo = extractIssueInfo(activeSession.github_issue_url)
                if (issueInfo) {
                    // Create GitHub issue comment
                    const response = await createIssueComment({
                        owner: issueInfo.owner,
                        repo: issueInfo.repo,
                        issue_number: issueInfo.issueNumber,
                        body: formatSessionComment(
                            duration,
                            message,
                        )
                    })
                    commentUrl = response.html_url
                }
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
            toast.success("Session ended successfully")
        },
        onError: (error) => {
            toast.error(`Failed to end session: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    })

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return
        setValue(searchQuery, true)
    }

    const handleStartSession = async (issue: GitHubIssue) => {
        if (!spaceData?.space || !spaceData?.space_member) return
        try {
            await createSession({
                github_issue_url: issue.html_url,
                space_member_id: spaceData.space_member.id,
            })
            // Clear search results
            queryClient.invalidateQueries({ queryKey: ['activeSession', slug] })
            toast.success("Session started successfully")
        } catch (error) {
            toast.error(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    const handleEndSession = () => {
        setShowEndSessionDialog(true)
    }

    const getSessionCount = (issueUrl: string) => {
        if (!sessionStats) return 0
        return sessionStats.counts[issueUrl] || 0
    }

    const getTotalDuration = (issueUrl: string) => {
        if (!sessionStats) return '0 minutes'
        const duration = sessionStats.durations[issueUrl] || 0
        return formatTime(duration)
    }

    const isCurrentSessionIssue = (issueUrl: string) => {
        return activeSession?.github_issue_url === issueUrl
    }

    const hasActiveSession = (issueUrl: string) => {
        return closedSessions?.some(session => session.github_issue_url === issueUrl)
    }

    if (isLoadingSpace) {
        return <div className="container mx-auto p-6">Loading...</div>
    }

    if (!spaceData?.space) {
        return <div className="container mx-auto p-6">Space not found</div>
    }

    if (!spaceData.space_member) {
        return <div className="container mx-auto p-6">Access denied. You are not a member of this space.</div>
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Sessions</h1>
            </div>

            {/* Active Session Timer */}
            {activeSession && (
                <div className="bg-card p-6 rounded-lg border space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Active Session</h2>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Issue:</span>
                                <a 
                                    href={activeSession.github_issue_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    {activeSession.github_issue_url}
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Time elapsed</p>
                            <div className="flex items-center space-x-2">
                                <span className="text-lg font-mono">
                                    {getSessionDuration(activeSession.started_at, new Date().toISOString())}
                                </span>
                            </div>
                        </div>
                        <div className="space-x-2">
                            <button
                                onClick={handleEndSession}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                            >
                                End Session
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Issues */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Search Issues</h2>
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search issues to start a new session..."
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {searchError && (
                    <div className="text-red-600 p-4 bg-red-50 rounded-md">
                        Error searching issues: {searchError instanceof Error ? searchError.message : 'Unknown error'}
                    </div>
                )}

                {searchResults && searchResults.length > 0 && (
                    <div className="space-y-3">
                        {searchResults.map((issue: GitHubIssue) => (
                            <div key={issue.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-lg">{issue.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {issue.repository.owner}/{issue.repository.name} #{issue.number}
                                        </p>
                                        {hasActiveSession(issue.html_url) && (
                                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                                <span>
                                                    {getSessionCount(issue.html_url)} Sessions
                                                </span>
                                                <span>
                                                    Total time: {getTotalDuration(issue.html_url)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        {isCurrentSessionIssue(issue.html_url) ? (
                                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                                Active
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleStartSession(issue)}
                                                disabled={!!activeSession}
                                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm"
                                            >
                                                Start Session
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Session History */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Session History</h2>
                    <div className="flex items-center space-x-4">
                        <Select value={timeFilter} onValueChange={(value: 'all' | 'day' | 'week') => setTimeFilter(value)}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All time</SelectItem>
                                <SelectItem value="day">Today</SelectItem>
                                <SelectItem value="week">This week</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="session-limit">Limit:</Label>
                            <Input
                                id="session-limit"
                                type="number"
                                value={sessionLimit}
                                onChange={(e) => setSessionLimit(parseInt(e.target.value))}
                                className="w-20"
                                min="1"
                                max="100"
                            />
                        </div>
                    </div>
                </div>

                {isLoadingSessions ? (
                    <div>Loading sessions...</div>
                ) : closedSessions && closedSessions.length > 0 ? (
                    <div className="space-y-3">
                        {closedSessions
                            .filter((session) => {
                                if (timeFilter === 'day') {
                                    const today = new Date().toDateString()
                                    return new Date(session.started_at).toDateString() === today
                                }
                                if (timeFilter === 'week') {
                                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                    return new Date(session.started_at) >= weekAgo
                                }
                                return true
                            })
                            .slice(0, sessionLimit)
                            .map((session) => (
                                <SessionCard key={session.id} {...session} />
                            ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No closed sessions found.</p>
                )}
            </div>

            {/* End Session Dialog */}
            {showEndSessionDialog && activeSession && (
                <EndSessionDialog
                    open={showEndSessionDialog}
                    onOpenChange={setShowEndSessionDialog}
                    message={endSessionMessage}
                    onMessageChange={setEndSessionMessage}
                    onEndSession={(skipSummary, selectedTags) => {
                        endSessionMutation.mutate({
                            sessionId: activeSession.id,
                            message: endSessionMessage,
                            skipSummary,
                            selectedTags
                        })
                    }}
                    isPending={endSessionMutation.isPending}
                    spaceId={spaceData.space!.id}
                />
            )}
        </div>
    )
}

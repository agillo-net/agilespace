import { createFileRoute } from '@tanstack/react-router'
import { getSpaceAndTracks } from '@/lib/supabase/queries'
import { useSessionChangeRequests } from '@/hooks/api/use-session-change-requests'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Check, X, Clock, User, Filter, UserCheck } from 'lucide-react'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/space/$slug/change-requests/')({
    component: ChangeRequestsPage,
    loader: async ({ params: { slug } }) => {
        return getSpaceAndTracks(slug)
    }
})

function ChangeRequestsPage() {
    const spaceData = Route.useLoaderData()
    const space = spaceData?.space
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

    const [requesterFilter, setRequesterFilter] = useState<string>('all')
    const [reviewerFilter, setReviewerFilter] = useState<string>('all')

    const {
        changeRequests,
        isLoading,
        approveRequest,
        rejectRequest,
        isApproving,
        isRejecting
    } = useSessionChangeRequests(space?.id || '')

    // Get unique requesters and reviewers for filter dropdowns
    const { uniqueRequesters, uniqueReviewers } = useMemo(() => {
        const requesterMap = new Map<string, { id: string; name: string }>()
        const reviewerMap = new Map<string, { id: string; name: string }>()

        for (const request of changeRequests) {
            // Process requesters
            const requesterId = request.session?.space_member?.user_id
            const requesterName = request.session?.space_member?.profile?.full_name
            if (requesterId && requesterName) {
                requesterMap.set(requesterId, { id: requesterId, name: requesterName })
            }

            // Process reviewers
            const reviewerId = request.reviewed_by
            const reviewerName = request.reviewer_profile?.full_name
            if (reviewerId && reviewerName) {
                reviewerMap.set(reviewerId, { id: reviewerId, name: reviewerName })
            }
        }

        return {
            uniqueRequesters: Array.from(requesterMap.values()),
            uniqueReviewers: Array.from(reviewerMap.values())
        }
    }, [changeRequests])

    const filteredRequests = changeRequests.filter(request => {
        // Status filter
        if (filter !== 'all' && request.status !== filter) return false

        // Requester filter
        if (requesterFilter !== 'all' && request.session?.space_member?.user_id !== requesterFilter) return false

        // Reviewer filter
        if (reviewerFilter !== 'all' && request.reviewed_by !== reviewerFilter) return false

        return true
    })

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'pending': return 'secondary'
            case 'approved': return 'default'
            case 'rejected': return 'destructive'
            default: return 'secondary'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="h-3 w-3" />
            case 'approved': return <Check className="h-3 w-3" />
            case 'rejected': return <X className="h-3 w-3" />
            default: return <Clock className="h-3 w-3" />
        }
    }

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading change requests...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Session Change Requests</h1>
                    <p className="text-muted-foreground mt-1">
                        Review and manage session change requests for {space?.name}
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status as 'all' | 'pending' | 'approved' | 'rejected')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                            filter === status
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status === 'pending' && changeRequests.filter(r => r.status === 'pending').length > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5 text-xs">
                                {changeRequests.filter(r => r.status === 'pending').length}
                            </Badge>
                        )}
                    </button>
                ))}
            </div>

            {/* Additional Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Filters:</span>
                </div>

                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Select value={requesterFilter} onValueChange={setRequesterFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by requester" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All requesters</SelectItem>
                            {uniqueRequesters.map((requester) => (
                                <SelectItem key={requester.id} value={requester.id}>
                                    {requester.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <Select value={reviewerFilter} onValueChange={setReviewerFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by reviewer" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All reviewers</SelectItem>
                            {uniqueReviewers.map((reviewer) => (
                                <SelectItem key={reviewer.id} value={reviewer.id}>
                                    {reviewer.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Clear filters button */}
                {(requesterFilter !== 'all' || reviewerFilter !== 'all') && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setRequesterFilter('all')
                            setReviewerFilter('all')
                        }}
                    >
                        Clear filters
                    </Button>
                )}
            </div>

            {/* Change Requests List */}
            <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-12">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground">
                            No {filter !== 'all' ? filter : ''} change requests
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {filter === 'all'
                                ? "No session change requests have been submitted yet."
                                : `No ${filter} requests found.`
                            }
                        </p>
                    </div>
                ) : (
                    filteredRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getStatusBadgeVariant(request.status || 'pending')}>
                                            {getStatusIcon(request.status || 'pending')}
                                            <span className="ml-1">
                                                {(request.status || 'pending').toUpperCase()}
                                            </span>
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            Track: {request.session?.track?.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span>Requested by {request.session?.space_member?.profile?.full_name || 'Unknown'}</span>
                                        <span>•</span>
                                        <span>{format(new Date(request.created_at || ''), 'MMM dd, yyyy HH:mm:ss')}</span>
                                    </div>
                                </div>
                                {request.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => rejectRequest(request.id)}
                                            disabled={isRejecting || isApproving}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => approveRequest(request.id)}
                                            disabled={isApproving || isRejecting}
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            Approve
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm text-muted-foreground">ORIGINAL</h4>
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <span className="font-medium">Track:</span>{' '}
                                            {request.original_track?.title || request.session?.track?.title || 'Unknown'}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Start:</span>{' '}
                                            {format(new Date(request.original_started_at), 'MMM dd, yyyy HH:mm:ss')}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">End:</span>{' '}
                                            {request.original_ended_at
                                                ? format(new Date(request.original_ended_at), 'MMM dd, yyyy HH:mm:ss')
                                                : 'Not ended'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm text-muted-foreground">REQUESTED</h4>
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <span className="font-medium">Track:</span>{' '}
                                            {request.requested_track?.title || request.session?.track?.title || 'No change'}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Start:</span>{' '}
                                            {format(new Date(request.requested_started_at), 'MMM dd, yyyy HH:mm:ss')}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">End:</span>{' '}
                                            {request.requested_ended_at
                                                ? format(new Date(request.requested_ended_at), 'MMM dd, yyyy HH:mm:ss')
                                                : 'Not ended'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {request.reason && (
                                <div className="pt-4 border-t">
                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">REASON</h4>
                                    <p className="text-sm bg-muted/50 p-3 rounded">{request.reason}</p>
                                </div>
                            )}

                            {request.status !== 'pending' && request.reviewed_by && request.reviewed_at && (
                                <div className="pt-4 border-t text-sm text-muted-foreground">
                                    <p>
                                        {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                                        {request.reviewer_profile?.full_name || 'Unknown'} on{' '}
                                        {format(new Date(request.reviewed_at), 'MMM dd, yyyy HH:mm:ss')}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

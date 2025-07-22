import { createFileRoute } from '@tanstack/react-router'
import { getSpaceAndTracks } from '@/lib/supabase/queries'
import { getCurrentUserSpaceRole } from '@/hooks/api/use-space-role'
import { useSessionChangeRequests } from '@/hooks/api/use-session-change-requests'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Check, X, Clock, User } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/space/$slug/change-requests/')({
    component: ChangeRequestsPage,
    loader: async ({ params: { slug } }) => {
        return getSpaceAndTracks(slug)
    }
})

function ChangeRequestsPage() {
    const { slug } = Route.useParams()
    const spaceData = Route.useLoaderData()
    const space = spaceData?.space
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
    
    const {
        changeRequests,
        isLoading,
        approveRequest,
        rejectRequest,
        isApproving,
        isRejecting
    } = useSessionChangeRequests(space?.id || '')

    const filteredRequests = changeRequests.filter(request => {
        if (filter === 'all') return true
        return request.status === filter
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
                    <h1 className="text-3xl font-bold">Duration Change Requests</h1>
                    <p className="text-muted-foreground mt-1">
                        Review and manage session duration change requests for {space?.name}
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status as any)}
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
                                ? "No duration change requests have been submitted yet."
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
                                        <span>Requested by {request.session?.space_member?.nickname || 'Unknown'}</span>
                                        <span>•</span>
                                        <span>{format(new Date(request.created_at || ''), 'MMM dd, yyyy HH:mm')}</span>
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
                                    <h4 className="font-medium text-sm text-muted-foreground">ORIGINAL DURATION</h4>
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <span className="font-medium">Start:</span>{' '}
                                            {format(new Date(request.original_started_at), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">End:</span>{' '}
                                            {request.original_ended_at 
                                                ? format(new Date(request.original_ended_at), 'MMM dd, yyyy HH:mm')
                                                : 'Not ended'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm text-muted-foreground">REQUESTED DURATION</h4>
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <span className="font-medium">Start:</span>{' '}
                                            {format(new Date(request.requested_started_at), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">End:</span>{' '}
                                            {request.requested_ended_at 
                                                ? format(new Date(request.requested_ended_at), 'MMM dd, yyyy HH:mm')
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
                                        {request.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                                        {format(new Date(request.reviewed_at), 'MMM dd, yyyy HH:mm')}
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
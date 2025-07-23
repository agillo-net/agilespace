import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { ClosedSession, Track } from '@/types'

interface RequestSessionChangeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    session: ClosedSession | null
    tracks: Track[]
    onSubmit: (data: {
        requestedStartedAt: string
        requestedEndedAt: string | null
        requestedTrackId?: string
        reason: string
    }) => void
    isPending: boolean
}

export function RequestSessionChangeDialog({
    open,
    onOpenChange,
    session,
    tracks,
    onSubmit,
    isPending
}: RequestSessionChangeDialogProps) {
    const [requestedStartDate, setRequestedStartDate] = useState("")
    const [requestedStartTime, setRequestedStartTime] = useState("")
    const [requestedEndDate, setRequestedEndDate] = useState("")
    const [requestedEndTime, setRequestedEndTime] = useState("")
    const [requestedTrackId, setRequestedTrackId] = useState<string>("")
    const [changeTrack, setChangeTrack] = useState(false)
    const [reason, setReason] = useState("")

    useEffect(() => {
        if (session && open) {
            // Convert UTC timestamps to local time for display
            const startDate = new Date(session.started_at)
            const endDate = session.ended_at ? new Date(session.ended_at) : new Date()

            // Format dates and times in local timezone
            setRequestedStartDate(format(startDate, 'yyyy-MM-dd'))
            setRequestedStartTime(format(startDate, 'HH:mm:ss'))
            setRequestedEndDate(format(endDate, 'yyyy-MM-dd'))
            setRequestedEndTime(format(endDate, 'HH:mm:ss'))
            setRequestedTrackId(session.track.id)
            setChangeTrack(false)
            setReason("")
        }
    }, [session, open])

    const handleSubmit = () => {
        if (!requestedStartDate || !requestedStartTime) return

        const requestedStartedAt = new Date(`${requestedStartDate}T${requestedStartTime}`).toISOString()
        const requestedEndedAt = requestedEndDate && requestedEndTime
            ? new Date(`${requestedEndDate}T${requestedEndTime}`).toISOString()
            : null

        onSubmit({
            requestedStartedAt,
            requestedEndedAt,
            requestedTrackId: changeTrack ? requestedTrackId : undefined,
            reason: reason.trim()
        })
    }

    const canSubmit = requestedStartDate && requestedStartTime && reason.trim().length > 0 && (!changeTrack || (requestedTrackId && requestedTrackId !== session?.track.id))

    if (!session) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Request Session Change</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        <p>Current Track: {session.track.title}</p>
                        <p>Original: {format(new Date(session.started_at), 'MMM dd, HH:mm')} - {session.ended_at ? format(new Date(session.ended_at), 'MMM dd, HH:mm') : 'Not ended'}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="start-date">Requested Start Time</Label>
                        <div className="flex gap-2">
                            <Input
                                id="start-date"
                                type="date"
                                value={requestedStartDate}
                                onChange={(e) => setRequestedStartDate(e.target.value)}
                                required
                            />
                            <Input
                                type="time"
                                step="1"
                                value={requestedStartTime}
                                onChange={(e) => setRequestedStartTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="end-date">Requested End Time</Label>
                        <div className="flex gap-2">
                            <Input
                                id="end-date"
                                type="date"
                                value={requestedEndDate}
                                onChange={(e) => setRequestedEndDate(e.target.value)}
                            />
                            <Input
                                type="time"
                                step="1"
                                value={requestedEndTime}
                                onChange={(e) => setRequestedEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="change-track"
                                checked={changeTrack}
                                onCheckedChange={(checked) => setChangeTrack(checked as boolean)}
                            />
                            <Label htmlFor="change-track">Change Track</Label>
                        </div>

                        {changeTrack && (
                            <SearchableSelect
                                options={tracks.map((track) => ({
                                    value: track.id,
                                    label: track.title || 'Untitled Track',
                                    disabled: track.id === session.track.id
                                }))}
                                value={requestedTrackId}
                                onValueChange={(value) => setRequestedTrackId(value || '')}
                                placeholder="Select a track"
                                searchPlaceholder="Search tracks..."
                                emptyText="No tracks found"
                                allowClear={false}
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Change *</Label>
                        <Textarea
                            id="reason"
                            placeholder="Please explain why you need to change the session..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit || isPending}
                    >
                        {isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 

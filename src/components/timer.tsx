import * as React from "react"
import { Button } from "@/components/ui/button"
import { Square, Trash2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getActiveSession, getSpaceAndTracks } from "@/lib/supabase/queries"
import { endSession, linkTagToSession, deleteSession } from "@/lib/supabase/mutations"
import { toast } from "sonner"
import { useRef } from "react"
import { useParams } from "@tanstack/react-router"
import { createIssueComment } from "@/lib/github/mutations"
import { EndSessionDialog } from "@/components/end-session-dialog"
import { DiscardSessionDialog } from "@/components/discard-session-dialog"
import type { Tag } from "@/types"
import { formatSessionComment, getGitHubIssueUrl } from "@/lib/utils"

export function Timer() {
    const [time, setTime] = React.useState(0)
    const [isRunning, setIsRunning] = React.useState(false)
    const [showEndSessionDialog, setShowEndSessionDialog] = React.useState(false)
    const [showDiscardDialog, setShowDiscardDialog] = React.useState(false)
    const [endSessionMessage, setEndSessionMessage] = React.useState("")

    const timerRef = useRef<NodeJS.Timeout>(null)
    const queryClient = useQueryClient()
    const { slug } = useParams({ from: "/space/$slug" })

    // Get active session
    const { data: activeSession } = useQuery({
        queryKey: ["activeSession", slug],
        queryFn: () => getActiveSession(),
        enabled: !!slug,
    })

    // Get space data for space ID
    const { data: spaceData } = useQuery({
        queryKey: ["space", slug],
        queryFn: () => getSpaceAndTracks(slug),
        enabled: !!slug,
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
            setIsRunning(false)
            setTime(0)
            setShowEndSessionDialog(false)
            setEndSessionMessage("")
            toast.success("Session ended successfully")
        },
        onError: (error) => {
            toast.error(`Failed to end session: ${error.message}`)
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
            setIsRunning(false)
            setTime(0)
            setShowDiscardDialog(false)
            toast.success("Session discarded successfully")
        },
        onError: (error) => {
            toast.error(`Failed to discard session: ${error.message}`)
        }
    })

    // Initialize timer state from active session
    React.useEffect(() => {
        if (activeSession) {
            setIsRunning(true)
            const startTime = new Date(activeSession.started_at).getTime()
            const now = new Date().getTime()
            const elapsedSeconds = Math.floor((now - startTime) / 1000)
            setTime(elapsedSeconds)
        } else {
            setIsRunning(false)
            setTime(0)
        }
    }, [activeSession])

    React.useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTime((prevTime) => prevTime + 1)
            }, 1000)
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [isRunning])

    const stopTimer = () => {
        if (activeSession) {
            setShowEndSessionDialog(true)
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

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const remainingSeconds = seconds % 60

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                {activeSession?.track && (
                    <div className="flex items-center gap-2">
                        <a
                            href={getGitHubIssueUrl(activeSession.track)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:underline"
                        >
                            {activeSession.track.title}
                        </a>
                    </div>
                )}
                <span className="font-mono text-sm">{formatTime(time)}</span>
                <div className="flex flex-row">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={stopTimer}
                        className="h-8 w-8"
                        disabled={!isRunning || endSessionMutation.isPending}
                    >
                        <Square className="h-4 w-4" />
                        <span className="sr-only">Stop</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowDiscardDialog(true)}
                        className="h-8 w-8"
                        disabled={!isRunning || endSessionMutation.isPending || discardSessionMutation.isPending}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Discard</span>
                    </Button>
                </div>
            </div>

            <EndSessionDialog
                open={showEndSessionDialog}
                onOpenChange={setShowEndSessionDialog}
                message={endSessionMessage}
                onMessageChange={setEndSessionMessage}
                onEndSession={handleEndSession}
                isPending={endSessionMutation.isPending}
                spaceId={spaceData?.space?.id || ''}
            />

            <DiscardSessionDialog
                open={showDiscardDialog}
                onOpenChange={setShowDiscardDialog}
                onConfirm={handleDiscardSession}
                isPending={discardSessionMutation.isPending}
            />
        </div>
    )
}

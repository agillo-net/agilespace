import * as React from "react"
import { Button } from "@/components/ui/button"
import { Square } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getActiveSession, getSpaceAndTracks } from "@/lib/supabase/queries"
import { endSession, linkTagToSession } from "@/lib/supabase/mutations"
import { toast } from "sonner"
import { useRef } from "react"
import { useParams } from "@tanstack/react-router"
import { createIssueComment } from "@/lib/github/mutations"
import { EndSessionDialog } from "@/components/end-session-dialog"
import type { Tag } from "@/types"
import { formatSessionComment } from "@/lib/utils"

export function Timer() {
    const [time, setTime] = React.useState(0)
    const [isRunning, setIsRunning] = React.useState(false)
    const [showEndSessionDialog, setShowEndSessionDialog] = React.useState(false)
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
            queryClient.invalidateQueries({ queryKey: ["activeSession", slug] })
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

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const remainingSeconds = seconds % 60

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const getGitHubIssueUrl = () => {
        if (!activeSession?.track) return ""
        const { repo_owner, repo_name, issue_number } = activeSession.track
        return `https://github.com/${repo_owner}/${repo_name}/issues/${issue_number}`
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                {activeSession?.track && (
                    <div className="flex items-center gap-2">
                        <a
                            href={getGitHubIssueUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:underline"
                        >
                            {activeSession.track.title}
                        </a>
                    </div>
                )}
                <span className="font-mono text-sm">{formatTime(time)}</span>
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
        </div>
    )
}

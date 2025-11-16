import * as React from "react"
import { Button } from "@/components/ui/button"
import { Square, Trash2 } from "lucide-react"
import { useRef } from "react"
import { useParams } from "@tanstack/react-router"
import { EndSessionDialog } from "@/components/end-session-dialog"
import { DiscardSessionDialog } from "@/components/discard-session-dialog"
import { getGitHubIssueUrl } from "@/lib/utils"
import { useSessions } from "@/hooks/api/use-sessions"
import { useAudioNotifications } from "@/hooks/use-audio-notifications"
import { cn } from "@/lib/utils"

export function Timer() {
    const [time, setTime] = React.useState(0)
    const [isRunning, setIsRunning] = React.useState(false)

    const timerRef = useRef<NodeJS.Timeout>(null)
    const startTimeRef = useRef<number | null>(null)
    const { slug } = useParams({ from: "/space/$slug" })
    
    const {
        activeSession,
        spaceData,
        endSessionMutation,
        discardSessionMutation,
        handleEndSession,
        handleDiscardSession,
        endSessionMessage,
        setEndSessionMessage,
        showEndSessionDialog,
        setShowEndSessionDialog,
        showDiscardDialog,
        setShowDiscardDialog
    } = useSessions(slug)

    // Audio notifications with visual feedback
    const { isNotifying } = useAudioNotifications(
        activeSession?.started_at || null,
        !!activeSession
    )


    // Initialize timer state from active session
    React.useEffect(() => {
        if (activeSession) {
            const startTime = new Date(activeSession.started_at).getTime()
            startTimeRef.current = startTime

            setIsRunning(true)
            setTime(Math.floor((Date.now() - startTime) / 1000))
        } else {
            setIsRunning(false)
            setTime(0)
            startTimeRef.current = null
        }
    }, [activeSession])

    React.useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                if (startTimeRef.current !== null) {
                    const now = Date.now()
                    setTime(Math.floor((now - startTimeRef.current) / 1000))
                }
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

    // Update timer state when session ends
    React.useEffect(() => {
        if (endSessionMutation.isSuccess || discardSessionMutation.isSuccess) {
            setIsRunning(false)
            setTime(0)
        }
    }, [endSessionMutation.isSuccess, discardSessionMutation.isSuccess])

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
                <span
                    className={cn(
                        "font-mono text-sm transition-all duration-300",
                        isNotifying && "text-orange-600 dark:text-orange-400 font-bold animate-pulse"
                    )}
                >
                    {formatTime(time)}
                </span>
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

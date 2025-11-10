import {
    CommandDialog,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Play, Plus, Github, CheckCircle2, Circle } from "lucide-react"
import { useCommandPalette } from "@/hooks/api/use-command-palette"
import { cn } from "@/lib/utils"


export function CommandPalette() {
    const {
        open,
        setOpen,
        searchQuery,
        setSearchQuery,
        isSearching,
        searchResults,
        sessionsHook,
        handleStartSession,
        handleCreateTrackAndStartSession,
        getTrackForIssue,
        isCurrentSessionTrack,
        debouncedSearchQuery
    } = useCommandPalette()


    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2 hidden xl:flex"
                onClick={() => setOpen(true)}
            >
                <Search className="h-4 w-4 xl:mr-2" />
                <span className="hidden xl:inline-flex">Search issues...</span>
                <CommandShortcut className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted p-1 xl:static xl:ml-auto">
                    <span className="text-xs">⌘</span>K
                </CommandShortcut>
            </Button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Search GitHub issues or existing tracks..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                />
                <CommandList>
                    <CommandEmpty>
                        {isSearching ? "Searching..." : searchQuery.trim() !== debouncedSearchQuery.trim() ? "Typing..." : searchQuery.trim() ? "No results found." : "Type to search GitHub issues..."}
                        {sessionsHook.activeSession && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                ⚠️ Active session in progress. End current session to start a new one.
                            </div>
                        )}
                    </CommandEmpty>

                    {/* Search Results */}
                    {debouncedSearchQuery.trim() && searchResults && searchResults.length > 0 && (
                        searchResults.map((issue) => {
                            const existingTrack = getTrackForIssue(issue)
                            const isActive = existingTrack ? isCurrentSessionTrack(existingTrack.id) : false
                            const sessionCount = existingTrack ? sessionsHook.getSessionCount(existingTrack.id) : null
                            const totalDuration = existingTrack ? sessionsHook.getTotalDuration(existingTrack.id) : null

                            // Check if any session is active (not just this specific issue)
                            const hasActiveSession = sessionsHook.activeSession !== null
                            const canSelect = !hasActiveSession && !sessionsHook.createTrackAndStartSessionMutation.isPending

                            return (
                                <CommandItem
                                    key={issue.id}
                                    onSelect={() => {
                                        if (canSelect) {
                                            if (existingTrack) {
                                                handleStartSession(existingTrack.id)
                                            } else {
                                                handleCreateTrackAndStartSession(issue)
                                            }
                                        }
                                    }}
                                    disabled={!canSelect}
                                    className={cn(
                                        "flex items-center justify-between gap-3 py-3",
                                        canSelect ? "cursor-pointer hover:bg-accent" : "cursor-not-allowed opacity-50"
                                    )}
                                >
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        {existingTrack ? (
                                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                                        ) : (
                                            <Circle className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                                        )}
                                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium truncate">{issue.title}</span>
                                                {existingTrack && (
                                                    <Badge variant="secondary" className="text-xs shrink-0">
                                                        Tracked
                                                    </Badge>
                                                )}
                                                {isActive && (
                                                    <Badge variant="default" className="text-xs shrink-0 bg-green-600">
                                                        Active
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Github className="h-3 w-3 shrink-0" />
                                                <span className="truncate">
                                                    {issue.repository.owner}/{issue.repository.name}#{issue.number}
                                                </span>
                                            </div>
                                            {existingTrack && (
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span>{sessionCount} sessions</span>
                                                    <span>•</span>
                                                    <span>{totalDuration}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {existingTrack ? (
                                            <Play className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Plus className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </CommandItem>
                            )
                        })
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
} 

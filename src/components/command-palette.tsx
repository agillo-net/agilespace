import {
    CommandDialog,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Search, Play, Plus, Github } from "lucide-react"
import { useCommandPalette } from "@/hooks/api/use-command-palette"
import { Command } from 'cmdk'
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
                <CommandShortcut className="pointer-events-none absolute right-1.5 top-2.5 inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:static xl:ml-auto">
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
                                        "flex items-center justify-between",
                                        canSelect ? "cursor-pointer hover:bg-accent" : "cursor-not-allowed opacity-50"
                                    )}
                                >
                                    <div className="flex items-center gap-2 max-w-[80%]">
                                        {existingTrack ? (
                                            <Github className="h-4 w-4 shrink-0" />
                                        ) : (
                                            <Plus className="h-4 w-4 shrink-0" />
                                        )}
                                        <div className="flex flex-col w-full">
                                            <span className="font-medium">{issue.title}</span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                {issue.repository.owner}/{issue.repository.name}#{issue.number}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[90px] text-xs text-muted-foreground text-right">
                                        <div className="flex items-center gap-1">
                                            {isActive && (
                                                <span className="text-green-600 font-medium">Active</span>
                                            )}
                                            {existingTrack ? (
                                                <Play className="h-3 w-3" />
                                            ) : (
                                                <Plus className="h-3 w-3" />
                                            )}
                                        </div>
                                        {existingTrack ? (
                                            <>
                                                <span>{sessionCount} sessions</span>
                                                <span>{totalDuration}</span>
                                                <span>Existing track</span>
                                            </>
                                        ) : (
                                            <span>Create & start</span>
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

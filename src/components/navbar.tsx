import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { CommandShortcut } from "@/components/ui/command"
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Timer } from "@/components/timer"
import { CommandPalette } from "@/components/command-palette"
import { NotificationBell } from "@/components/notifications"

interface NavbarProps {
    createIssueOpen?: boolean
    setCreateIssueOpen?: (open: boolean) => void
    organizationLogin?: string
    spaceId?: string
}

export function Navbar({ createIssueOpen, setCreateIssueOpen, organizationLogin, spaceId }: NavbarProps = {}) {
    const { state, toggleSidebar, isMobile } = useSidebar()

    return (
        <>
            <nav className={cn("fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[left] duration-200 ease-linear", state === "collapsed" ? "left-0" : "left-64")}>
                <div className="flex h-14 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className={cn(
                                "mr-2",
                                isMobile && "h-9 w-9"
                            )}
                        >
                            {state === "expanded" ? (
                                <PanelLeftClose className="h-5 w-5" />
                            ) : (
                                <PanelLeftOpen className="h-5 w-5" />
                            )}
                            <span className="sr-only">Toggle Sidebar</span>
                        </Button>
                        <CommandPalette />
                        <Button
                             variant="outline"
                             onClick={() => setCreateIssueOpen?.(true)}
                             className="relative h-9 xl:h-10 flex items-center gap-2 pr-16 px-3 py-2 hidden sm:flex"
                             disabled={!organizationLogin}
                         >
                             <Plus className="h-4 w-4" />
                             Create Issue
                             <CommandShortcut className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted p-1">
                                 <span className="text-xs">⇧⌘1</span>
                             </CommandShortcut>
                         </Button>

                         {/* Mobile version - icon only */}
                         <Button
                             variant="outline"
                             onClick={() => setCreateIssueOpen?.(true)}
                             className="sm:hidden w-9 h-9"
                             disabled={!organizationLogin}
                         >
                             <Plus className="h-4 w-4" />
                             <span className="sr-only">Create Issue</span>
                         </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBell spaceId={spaceId} />
                        <Timer />
                    </div>
                </div>
            </nav>
        </>
    )
}

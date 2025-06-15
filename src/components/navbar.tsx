
import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Timer } from "@/components/timer"

export function Navbar() {
    const { state, toggleSidebar } = useSidebar()

    return (
        <nav className={cn("fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[left] duration-200 ease-linear", state === "collapsed" ? "left-0" : "left-64")}>
            <div className="flex h-14 items-center justify-between px-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="mr-2"
                >
                    {state === "expanded" ? (
                        <PanelLeftClose className="h-5 w-5" />
                    ) : (
                        <PanelLeftOpen className="h-5 w-5" />
                    )}
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
                <Timer />
            </div>
        </nav>
    )
}

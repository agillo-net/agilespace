import { Header } from "@/components/layout/Header";
import { Outlet } from "@tanstack/react-router"
import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from "@/lib/guards/auth-guard";

export const Route = createFileRoute('/_authenticated')({
    beforeLoad: requireAuth,
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div className="min-h-screen flex flex-col gap-2">
            <Header />
            <div className="flex-1">
                <Outlet />
            </div>
        </div>
    )
}


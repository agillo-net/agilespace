"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { Clock, BarChart2 } from "lucide-react";

const sidebarItems = [
  {
    title: "Tracker",
    href: "/dashboard/tracker",
    icon: Clock,
  },
  {
    title: "Analysis",
    href: "/dashboard/analysis",
    icon: BarChart2,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Work Session Tracker</h2>
        </div>
        <div className="py-4">
          <nav className="space-y-1 px-3">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-2 h-5 w-5",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserButton afterSignOutUrl="/login" />
              <span className="text-sm font-medium">Account</span>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex flex-1 flex-col pl-64">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-6">
          <h1 className="text-xl font-semibold">
            {pathname === "/dashboard/tracker" && "Tracker"}
            {pathname === "/dashboard/analysis" && "Analysis"}
            {pathname === "/dashboard" && "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            {/* Add header controls here if needed */}
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
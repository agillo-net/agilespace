"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TaskTimer } from "@/components/task-timer";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

export function AppHeader() {
  return (
    <header className="bg-background fixed top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DynamicBreadcrumb />
        <div className="flex-1" />
        <TaskTimer />
      </div>
    </header>
  );
}

"use client";

import { TaskTimer } from "@/components/task-timer";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

export function AppHeader({
  toggleSecondPanel,
}: {
  toggleSecondPanel: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center justify-between w-full px-4">
        <DynamicBreadcrumb />
        <TaskTimer toggleSecondPanel={toggleSecondPanel} />
      </div>
    </header>
  );
}

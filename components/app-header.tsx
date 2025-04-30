"use client";

import { TaskTimer } from "@/components/task-timer";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

export function AppHeader({
  toggleSecondPanel,
}: {
  toggleSecondPanel: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center justify-between w-full px-4">
        <DynamicBreadcrumb />
        <TaskTimer toggleSecondPanel={toggleSecondPanel} />
      </div>
    </header>
  );
}

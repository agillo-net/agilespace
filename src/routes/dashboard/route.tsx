import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const toggleSecondPanel = () => {
    setIsSidePanelOpen((prev) => !prev);
  };

  return (
    <SidebarProvider>
      <AppSidebar activeOrgLogin={orgName} />
      <SidebarInset className="flex flex-col h-screen">
        <TimerInitializer />
        <AppHeader toggleSecondPanel={toggleSecondPanel} />
        <div className="flex-1 overflow-hidden flex">
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel className="min-h-0" defaultSize={70} minSize={50}>
              <div className="h-full overflow-auto">{children}</div>
            </ResizablePanel>
            {isSidePanelOpen && (
              <>
                <ResizableHandle />
                <ResizablePanel
                  defaultSize={30}
                  minSize={20}
                  maxSize={50}
                  className="min-h-0"
                >
                  <div className="h-full overflow-hidden">
                    <SidePanel orgName={orgName} />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </SidebarInset>
      <WorkSessionModal />
      <RefreshPreventionDialog />
    </SidebarProvider>
  );
}

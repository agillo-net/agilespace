import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$orgSlug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { orgSlug } = Route.useParams();

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
("use client");

import { useState } from "react";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { TimerInitializer } from "@/components/timer-initializer";
import { WorkSessionModal } from "@/components/work-session-modal";
import { RefreshPreventionDialog } from "@/components/refresh-prevention-dialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ActiveSessionPanel } from "@/components/sessions/active-session-panel";
import { SidePanel } from "@/components/panel/side-panel";

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { orgName }: { orgName: string } = useParams();

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

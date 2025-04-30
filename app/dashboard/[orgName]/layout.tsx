"use client";

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
      <SidebarInset>
        <TimerInitializer />
        <AppHeader toggleSecondPanel={toggleSecondPanel} />
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>{children}</ResizablePanel>
          {isSidePanelOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={30}>
                <ActiveSessionPanel />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </SidebarInset>
      <WorkSessionModal />
      <RefreshPreventionDialog />
    </SidebarProvider>
  );
}

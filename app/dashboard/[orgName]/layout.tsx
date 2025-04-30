"use client";

import { useParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { TimerInitializer } from "@/components/timer-initializer";
import { WorkSessionModal } from "@/components/work-session-modal";
import { RefreshPreventionDialog } from "@/components/refresh-prevention-dialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { orgName }: { orgName: string } = useParams();

  return (
    <SidebarProvider>
      <AppSidebar activeOrgLogin={orgName} />
      <SidebarInset>
        <TimerInitializer />
        <AppHeader />
        {children}
      </SidebarInset>
      <WorkSessionModal />
      <RefreshPreventionDialog />
    </SidebarProvider>
  );
}

import { server } from "@/lib/github";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { TimerInitializer } from "@/components/timer-initializer";
import { WorkSessionModal } from "@/components/work-session-modal";
import { RefreshPreventionDialog } from "@/components/refresh-prevention-dialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await server.getCurrentUser();
  const userOrgs = await server.getUserOrgs();

  return (
    <SidebarProvider>
      <AppSidebar user={user} orgs={userOrgs} />
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

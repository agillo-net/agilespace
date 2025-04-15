import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import { AppHeader } from "@/components/app-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { WorkSessionModal } from "@/components/work-session-modal";
import { TimerInitializer } from "@/components/timer-initializer";
import { RefreshPreventionDialog } from "@/components/refresh-prevention-dialog";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {session ? (
            <div className="[--header-height:calc(theme(spacing.14))]">
              <SessionProvider session={session}>
                <SidebarProvider className="flex flex-col">
                  <TimerInitializer />
                  <AppHeader />
                  <main className="flex-1">
                    <div className="w-full p-8 pt-16 mx-auto space-y-6">
                      {children}
                    </div>
                  </main>
                  <WorkSessionModal />
                  <RefreshPreventionDialog />
                </SidebarProvider>
              </SessionProvider>
            </div>
          ) : (
            <div>{children}</div>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}

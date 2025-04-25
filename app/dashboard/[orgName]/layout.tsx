"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { OrgSidebar } from "@/components/org-sidebar";

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1">
      <OrgSidebar />
      <SidebarInset>
        <div className="container mx-auto py-6">{children}</div>
      </SidebarInset>
    </div>
  );
}

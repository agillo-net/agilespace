"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronsUpDown } from "lucide-react";
import { GitHubOrg, client } from "@/lib/github";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function OrgSwitcher({ activeOrgLogin }: { activeOrgLogin: string }) {
  const { isMobile } = useSidebar();

  const [orgs, setOrgs] = React.useState<GitHubOrg[]>([]);
  const [activeOrg, setActiveOrg] = React.useState<GitHubOrg | null>(null);

  React.useEffect(() => {
    const fetchOrgs = async () => {
      const fetchedOrgs = await client.getUserOrgs();
      setOrgs(fetchedOrgs);
      const currentOrg = fetchedOrgs.find(
        (org) => org.login === activeOrgLogin
      );
      setActiveOrg(currentOrg || null);
    };

    fetchOrgs();
  }, []);

  if (!activeOrg) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            Loading...
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={activeOrg.avatar_url}
                    alt={activeOrg.login}
                  />
                  <AvatarFallback>
                    {activeOrg.login.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeOrg.login}
                </span>
                <span className="truncate text-xs">Free</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {orgs.map((org, index) => (
              <Link key={org.login} href={`/dashboard/${org.login}`}>
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Avatar className="h-4 w-4 rounded-lg">
                      <AvatarImage src={org.avatar_url} alt={org.login} />
                      <AvatarFallback>
                        {org.login.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {org.login}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              </Link>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface OrgSwitcherProps {
  orgs: Array<{
    title: string;
    url: string;
    isActive: boolean;
    avatar: string;
  }>;
  handleNavigation: (item: { login: string; avatar_url?: string; }) => void;
}

export function OrgSwitcher({ orgs, handleNavigation }: OrgSwitcherProps) {
  const { isMobile } = useSidebar();
  const activeTeam = orgs.find((team) => team.isActive) || orgs[0];

  if (!activeTeam) {
    return null;
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
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={activeTeam.avatar} alt={activeTeam.title} />
                <AvatarFallback className="text-xs">
                  {activeTeam.title.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.title}
                </span>
                <span className="truncate text-xs">{activeTeam.url}</span>
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
              <DropdownMenuItem
                key={org.title}
                onClick={() => handleNavigation(org)}
                className="gap-2 p-2"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={org.avatar} alt={org.title} />
                  <AvatarFallback className="text-xs">
                    {org.title.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {org.title}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add Organization</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

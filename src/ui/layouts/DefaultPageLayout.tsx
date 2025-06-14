"use client";
/*
 * Documentation:
 * Default Page Layout — https://app.subframe.com/library?component=Default+Page+Layout_a57b1c43-310a-493f-b807-8cc88e2452cf
 * Sidebar rail with icons — https://app.subframe.com/library?component=Sidebar+rail+with+icons_0d7efe0e-8762-46f5-b399-9f6d329e13b9
 * Dropdown Menu — https://app.subframe.com/library?component=Dropdown+Menu_99951515-459b-4286-919e-a89e7549b43b
 * Avatar — https://app.subframe.com/library?component=Avatar_bec25ae6-5010-4485-b46b-cf79e3943ab2
 */

import React from "react";
import * as SubframeUtils from "../utils";
import { SidebarRailWithIcons } from "../components/SidebarRailWithIcons";
import { FeatherHome } from "@subframe/core";
import { FeatherInbox } from "@subframe/core";
import { FeatherBarChart2 } from "@subframe/core";
import { FeatherFolder } from "@subframe/core";
import { FeatherBell } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { DropdownMenu } from "../components/DropdownMenu";
import { FeatherUser } from "@subframe/core";
import { FeatherLogOut } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { Avatar } from "../components/Avatar";

interface DefaultPageLayoutRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

const DefaultPageLayoutRoot = React.forwardRef<
  HTMLElement,
  DefaultPageLayoutRootProps
>(function DefaultPageLayoutRoot(
  { children, className, ...otherProps }: DefaultPageLayoutRootProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex h-screen w-full items-start",
        className
      )}
      ref={ref as any}
      {...otherProps}
    >
      <SidebarRailWithIcons
        header={
          <div className="flex flex-col items-center justify-center gap-2 px-1 py-1">
            <img
              className="h-6 w-6 flex-none object-cover"
              src="https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/y2rsnhq3mex4auk54aye.png"
            />
          </div>
        }
        footer={
          <>
            <SidebarRailWithIcons.NavItem icon={<FeatherBell />}>
              Item
            </SidebarRailWithIcons.NavItem>
            <SidebarRailWithIcons.NavItem icon={<FeatherSettings />}>
              Item
            </SidebarRailWithIcons.NavItem>
            <div className="flex flex-col items-center justify-end gap-1 px-1 py-1">
              <SubframeCore.DropdownMenu.Root>
                <SubframeCore.DropdownMenu.Trigger asChild={true}>
                  <Avatar
                    size="small"
                    image="https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/fychrij7dzl8wgq2zjq9.avif"
                  >
                    A
                  </Avatar>
                </SubframeCore.DropdownMenu.Trigger>
                <SubframeCore.DropdownMenu.Portal>
                  <SubframeCore.DropdownMenu.Content
                    side="right"
                    align="end"
                    sideOffset={4}
                    asChild={true}
                  >
                    <DropdownMenu>
                      <DropdownMenu.DropdownItem icon={<FeatherUser />}>
                        Profile
                      </DropdownMenu.DropdownItem>
                      <DropdownMenu.DropdownItem icon={<FeatherSettings />}>
                        Settings
                      </DropdownMenu.DropdownItem>
                      <DropdownMenu.DropdownItem icon={<FeatherLogOut />}>
                        Log out
                      </DropdownMenu.DropdownItem>
                    </DropdownMenu>
                  </SubframeCore.DropdownMenu.Content>
                </SubframeCore.DropdownMenu.Portal>
              </SubframeCore.DropdownMenu.Root>
            </div>
          </>
        }
      >
        <SidebarRailWithIcons.NavItem icon={<FeatherHome />} selected={true}>
          Home
        </SidebarRailWithIcons.NavItem>
        <SidebarRailWithIcons.NavItem icon={<FeatherInbox />}>
          Inbox
        </SidebarRailWithIcons.NavItem>
        <SidebarRailWithIcons.NavItem icon={<FeatherBarChart2 />}>
          Reports
        </SidebarRailWithIcons.NavItem>
        <SidebarRailWithIcons.NavItem icon={<FeatherFolder />}>
          Projects
        </SidebarRailWithIcons.NavItem>
      </SidebarRailWithIcons>
      {children ? (
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch overflow-y-auto bg-default-background">
          {children}
        </div>
      ) : null}
    </div>
  );
});

export const DefaultPageLayout = DefaultPageLayoutRoot;

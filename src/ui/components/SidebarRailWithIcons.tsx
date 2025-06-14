"use client";
/*
 * Documentation:
 * Sidebar rail with icons — https://app.subframe.com/library?component=Sidebar+rail+with+icons_0d7efe0e-8762-46f5-b399-9f6d329e13b9
 * Dropdown Menu — https://app.subframe.com/library?component=Dropdown+Menu_99951515-459b-4286-919e-a89e7549b43b
 * Avatar — https://app.subframe.com/library?component=Avatar_bec25ae6-5010-4485-b46b-cf79e3943ab2
 */

import React from "react";
import * as SubframeUtils from "../utils";
import { DropdownMenu } from "./DropdownMenu";
import { FeatherSettings } from "@subframe/core";
import { FeatherLogOut } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { FeatherCircleDashed } from "@subframe/core";
import { Tooltip } from "./Tooltip";

interface NavItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  children?: React.ReactNode;
  selected?: boolean;
  className?: string;
}

const NavItem = React.forwardRef<HTMLElement, NavItemProps>(function NavItem(
  {
    icon = <FeatherCircleDashed />,
    children,
    selected = false,
    className,
    ...otherProps
  }: NavItemProps,
  ref
) {
  return (
    <SubframeCore.Tooltip.Provider>
      <SubframeCore.Tooltip.Root>
        <SubframeCore.Tooltip.Trigger asChild={true}>
          <div
            className={SubframeUtils.twClassNames(
              "group/ba3a61e5 flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-neutral-50 active:bg-neutral-100",
              { "bg-brand-50 hover:bg-brand-50 active:bg-brand-100": selected },
              className
            )}
            ref={ref as any}
            {...otherProps}
          >
            {icon ? (
              <SubframeCore.IconWrapper
                className={SubframeUtils.twClassNames(
                  "text-heading-3 font-heading-3 text-neutral-600",
                  { "text-brand-700": selected }
                )}
              >
                {icon}
              </SubframeCore.IconWrapper>
            ) : null}
          </div>
        </SubframeCore.Tooltip.Trigger>
        <SubframeCore.Tooltip.Portal>
          <SubframeCore.Tooltip.Content
            side="right"
            align="center"
            sideOffset={4}
            asChild={true}
          >
            <Tooltip>{children}</Tooltip>
          </SubframeCore.Tooltip.Content>
        </SubframeCore.Tooltip.Portal>
      </SubframeCore.Tooltip.Root>
    </SubframeCore.Tooltip.Provider>
  );
});

interface SidebarRailWithIconsRootProps
  extends React.HTMLAttributes<HTMLElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const SidebarRailWithIconsRoot = React.forwardRef<
  HTMLElement,
  SidebarRailWithIconsRootProps
>(function SidebarRailWithIconsRoot(
  {
    header,
    footer,
    children,
    className,
    ...otherProps
  }: SidebarRailWithIconsRootProps,
  ref
) {
  return (
    <nav
      className={SubframeUtils.twClassNames(
        "flex h-full flex-col items-start border-r border-solid border-neutral-border bg-default-background",
        className
      )}
      ref={ref as any}
      {...otherProps}
    >
      {header ? (
        <div className="flex w-full flex-col items-center justify-center gap-2 px-3 py-3">
          {header}
        </div>
      ) : null}
      {children ? (
        <div className="flex w-full grow shrink-0 basis-0 flex-col items-center gap-1 px-3 py-3 overflow-auto">
          {children}
        </div>
      ) : null}
      {footer ? (
        <div className="flex w-full flex-col items-center justify-end gap-1 border-t border-solid border-neutral-border px-3 py-3">
          {footer}
        </div>
      ) : null}
    </nav>
  );
});

export const SidebarRailWithIcons = Object.assign(SidebarRailWithIconsRoot, {
  NavItem,
});

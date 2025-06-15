"use client";

import React from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { ActiveSessionCard } from "@/ui/components/ActiveSessionCard";
import { Progress } from "@/ui/components/Progress";
import { Tabs } from "@/ui/components/Tabs";
import { Table } from "@/ui/components/Table";
import { FeatherGitPullRequest } from "@subframe/core";
import { Badge } from "@/ui/components/Badge";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherExternalLink } from "@subframe/core";
import { Button } from "@/ui/components/Button";
import { FeatherFilter } from "@subframe/core";
import { FeatherMoreHorizontal } from "@subframe/core";

function DeveloperWorkspaceHub() {
  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full flex-col items-start gap-6 bg-default-background px-6 py-6">
        <ActiveSessionCard currentActiveSession={{
          id: "1",
          title: "Fix authentication flow in login service",
          duration: 2555,
          startedAt: new Date(Date.now() - 2555 * 1000)
        }} />
        <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Time Tracking
          </span>
          <div className="flex w-full flex-col items-start gap-4">
            <div className="flex w-full items-center gap-4">
              <span className="w-32 flex-none text-body-bold font-body-bold text-default-font">
                Today
              </span>
              <Progress value={75} />
              <div className="flex items-center">
                <span className="grow shrink-0 basis-0 text-body font-body text-default-font">
                  6
                </span>
                <span className="w-32 flex-none text-body font-body text-default-font">
                  h / 8h
                </span>
              </div>
            </div>
            <div className="flex w-full items-center gap-4">
              <span className="w-32 flex-none text-body-bold font-body-bold text-default-font">
                Monthly
              </span>
              <Progress value={45} />
              <div className="flex items-center">
                <span className="grow shrink-0 basis-0 text-body font-body text-default-font">
                  72
                </span>
                <span className="w-32 flex-none text-body font-body text-default-font">
                  h / 160h
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-4">
          <Tabs>
            <Tabs.Item active={true}>Assigned Issues (4)</Tabs.Item>
            <Tabs.Item>Code Reviews (2)</Tabs.Item>
            <Tabs.Item>Your PRs (3)</Tabs.Item>
          </Tabs>
          <Table
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>Title</Table.HeaderCell>
                <Table.HeaderCell>Labels</Table.HeaderCell>
                <Table.HeaderCell>Updated</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.HeaderRow>
            }
          >
            <Table.Row>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <FeatherGitPullRequest className="text-body font-body text-brand-600" />
                  <span className="text-body-bold font-body-bold text-default-font">
                    auth-service/login-flow
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Badge variant="error">bug</Badge>
                  <Badge variant="warning">security</Badge>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="text-body font-body text-subtext-color">
                  2h ago
                </span>
              </Table.Cell>
              <Table.Cell>
                <IconButton
                  icon={<FeatherExternalLink />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <FeatherGitPullRequest className="text-body font-body text-brand-600" />
                  <span className="text-body-bold font-body-bold text-default-font">
                    api/rate-limiting
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Badge>enhancement</Badge>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="text-body font-body text-subtext-color">
                  5h ago
                </span>
              </Table.Cell>
              <Table.Cell>
                <IconButton
                  icon={<FeatherExternalLink />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              </Table.Cell>
            </Table.Row>
          </Table>
        </div>
        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full items-center justify-between">
            <span className="text-heading-3 font-heading-3 text-default-font">
              Recent Work Sessions
            </span>
            <Button
              variant="neutral-tertiary"
              icon={<FeatherFilter />}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Filter
            </Button>
          </div>
          <Table
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>Issue</Table.HeaderCell>
                <Table.HeaderCell>Duration</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Tags</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.HeaderRow>
            }
          >
            <Table.Row>
              <Table.Cell>
                <span className="text-body-bold font-body-bold text-default-font">
                  Implement OAuth flow
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="text-body font-body text-default-font">
                  2h 15m
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="text-body font-body text-subtext-color">
                  Today
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">auth</Badge>
                  <Badge variant="neutral">api</Badge>
                </div>
              </Table.Cell>
              <Table.Cell>
                <IconButton
                  icon={<FeatherMoreHorizontal />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <span className="text-body-bold font-body-bold text-default-font">
                  Fix memory leak in worker
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="text-body font-body text-default-font">
                  1h 45m
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="text-body font-body text-subtext-color">
                  Yesterday
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">performance</Badge>
                </div>
              </Table.Cell>
              <Table.Cell>
                <IconButton
                  icon={<FeatherMoreHorizontal />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              </Table.Cell>
            </Table.Row>
          </Table>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default DeveloperWorkspaceHub;

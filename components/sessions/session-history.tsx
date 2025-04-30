"use client";

import { format } from "date-fns";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  CheckCircleIcon,
  ExternalLinkIcon,
  EllipsisVerticalIcon,
  PencilIcon,
} from "lucide-react";

import { formatDuration, getIssueDetails } from "./utils";
import { Session, Label } from "./types";

interface SessionHistoryProps {
  sessions: Session[];
  allLabels: Label[];
}

export function SessionHistory({ sessions, allLabels }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/30 text-center">
        <CheckCircleIcon className="h-10 w-10 mb-2 text-muted-foreground" />
        <h3 className="text-lg font-medium">No completed sessions</h3>
        <p className="text-muted-foreground mt-1">
          Your completed work sessions will appear here
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Labels</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>
                  <Link
                    href={session.github_issue_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center"
                  >
                    {getIssueDetails(session.github_issue_link).fullName}
                    <ExternalLinkIcon className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {formatDuration(session.hours)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5 flex-wrap">
                    {session.labels &&
                      session.labels
                        .filter((label) => label)
                        .slice(0, 3)
                        .map((label) => {
                          const matchingLabel = allLabels.find(
                            (l) => l.name === label
                          );
                          return (
                            <Badge
                              key={label}
                              variant="outline"
                              style={{
                                backgroundColor: matchingLabel
                                  ? `#${matchingLabel.color}20`
                                  : undefined,
                                borderColor: matchingLabel
                                  ? `#${matchingLabel.color}60`
                                  : undefined,
                                color: matchingLabel
                                  ? `#${matchingLabel.color}`
                                  : undefined,
                              }}
                            >
                              {label}
                            </Badge>
                          );
                        })}
                    {session.labels &&
                      session.labels.filter((label) => label).length > 3 && (
                        <Badge variant="outline">
                          +{session.labels.length - 3}
                        </Badge>
                      )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {format(
                        new Date(session.end_time || session.updated_at),
                        "PPP"
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(
                        new Date(session.end_time || session.updated_at),
                        "p"
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={session.github_issue_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer"
                        >
                          <ExternalLinkIcon className="h-4 w-4 mr-2" />
                          View Issue
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      <Dialog>
                        <DialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Session Details</DialogTitle>
                            <DialogDescription>
                              {
                                getIssueDetails(session.github_issue_link)
                                  .fullName
                              }
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-2">
                            <div className="flex justify-between text-sm">
                              <div className="text-muted-foreground">
                                Duration
                              </div>
                              <div className="font-medium">
                                {formatDuration(session.hours)}
                              </div>
                            </div>

                            <div className="flex justify-between text-sm">
                              <div className="text-muted-foreground">Date</div>
                              <div>
                                {format(new Date(session.start_time), "PPP")}
                              </div>
                            </div>

                            <div className="flex justify-between text-sm">
                              <div className="text-muted-foreground">Time</div>
                              <div>
                                {format(new Date(session.start_time), "p")} -{" "}
                                {format(
                                  new Date(
                                    session.end_time || session.updated_at
                                  ),
                                  "p"
                                )}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="text-sm text-muted-foreground">
                                Labels
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                {session.labels &&
                                  session.labels
                                    .filter((label) => label)
                                    .map((label) => {
                                      const matchingLabel = allLabels.find(
                                        (l) => l.name === label
                                      );
                                      return (
                                        <Badge
                                          key={label}
                                          variant="outline"
                                          style={{
                                            backgroundColor: matchingLabel
                                              ? `#${matchingLabel.color}20`
                                              : undefined,
                                            borderColor: matchingLabel
                                              ? `#${matchingLabel.color}60`
                                              : undefined,
                                            color: matchingLabel
                                              ? `#${matchingLabel.color}`
                                              : undefined,
                                          }}
                                        >
                                          {label}
                                        </Badge>
                                      );
                                    })}
                                {(!session.labels ||
                                  session.labels.length === 0) && (
                                  <span className="text-muted-foreground text-xs italic">
                                    No labels
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="text-sm text-muted-foreground">
                                Notes
                              </div>
                              <div className="text-sm border rounded-md p-3 min-h-[80px] bg-muted/30">
                                {session.notes ? (
                                  session.notes
                                ) : (
                                  <span className="text-muted-foreground italic">
                                    No notes for this session.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

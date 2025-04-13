"use client";

import { formatTime } from "@/lib/format-time";
import { useTimerStore } from "@/store/timer-store";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "@/components/ui/external-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export function TaskTimer() {
  const { issues, activeIssueId, toggleTimer, stopTracking, switchToIssue } =
    useTimerStore();

  const activeIssue = issues.find(issue => issue.id === activeIssueId);
  if (!activeIssue) return null;

  return (
    <>
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex items-center">
        <div className="hidden md:flex flex-col items-start pr-2">
          <div className="text-xs text-muted-foreground">Tracking</div>
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0">
                  <div className="text-sm font-medium truncate max-w-[200px]">
                    {activeIssue.title}
                  </div>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {issues.map((issue) => (
                  <DropdownMenuItem
                    key={issue.id}
                    onClick={() => switchToIssue(issue.id)}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate max-w-[200px]">{issue.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatTime(issue.elapsedTime)}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ExternalLink href={activeIssue.url} title="Open in GitHub" />
          </div>
        </div>

        <div className="flex items-center pl-2">
          <div className="text-lg font-mono w-20">
            {formatTime(activeIssue.elapsedTime)}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTimer}
            aria-label={activeIssue.isRunning ? "Pause timer" : "Start timer"}
          >
            {activeIssue.isRunning ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={stopTracking}
            aria-label="Stop tracking"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

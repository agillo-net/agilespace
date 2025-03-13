"use client";

import { formatTime } from "@/lib/format-time";
import { useTimerStore } from "@/store/timer-store";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "@/components/ui/external-link";

export function TaskTimer() {
  const { isRunning, elapsedTime, activeIssue, toggleTimer, stopTracking } =
    useTimerStore();

  if (!activeIssue) return null;

  return (
    <>
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex items-center">
        <div className="hidden md:flex flex-col items-start pr-2">
          <div className="text-xs text-muted-foreground">Tracking</div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium truncate max-w-[200px]">
              {activeIssue.title}
            </div>
            <ExternalLink href={activeIssue.url} title="Open in GitHub" />
          </div>
        </div>

        <div className="flex items-center pl-2">
          <div className="text-lg font-mono w-20">
            {formatTime(elapsedTime)}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTimer}
            aria-label={isRunning ? "Pause timer" : "Start timer"}
          >
            {isRunning ? (
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

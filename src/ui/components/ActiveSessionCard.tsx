"use client";
/*
 * Documentation:
 * Active Session Card — https://app.subframe.com/library?component=Active+Session+Card_31319969-8c27-42d2-9ab8-2664a00e2f4b
 * Badge — https://app.subframe.com/library?component=Badge_97bdb082-1124-4dd7-a335-b14b822d0157
 * Button — https://app.subframe.com/library?component=Button_3b777358-b86b-40af-9327-891efc6826fe
 */

import React, { useState, useEffect } from "react";
import * as SubframeUtils from "../utils";
import { Badge } from "./Badge";
import { FeatherGitPullRequest, FeatherSearch } from "@subframe/core";
import { Button } from "./Button";

interface ActiveSession {
  id: string;
  title: string;
  duration: number; // duration in seconds
  startedAt: Date;
}

interface ActiveSessionCardRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  currentActiveSession?: ActiveSession | null;
}

const ActiveSessionCardRoot = React.forwardRef<
  HTMLElement,
  ActiveSessionCardRootProps
>(function ActiveSessionCardRoot(
  { className, currentActiveSession, ...otherProps }: ActiveSessionCardRootProps,
  ref
) {
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    if (!currentActiveSession) return;

    // Initialize elapsed time
    const initialElapsed = Math.floor((Date.now() - currentActiveSession.startedAt.getTime()) / 1000);
    setElapsedTime(initialElapsed);

    // Update timer every second
    const interval = setInterval(() => {
      const newElapsed = Math.floor((Date.now() - currentActiveSession.startedAt.getTime()) / 1000);
      setElapsedTime(newElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentActiveSession]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm",
        className
      )}
      ref={ref as any}
      {...otherProps}
    >
      <div className="flex w-full flex-col items-start gap-4">
        <div className="flex w-full items-center justify-between">
          <span className="text-heading-3 font-heading-3 text-default-font">
            {currentActiveSession ? "Active Session" : "Start New Session"}
          </span>
          {currentActiveSession && (
            <div className="flex items-center justify-between">
              <Badge>{formatDuration(elapsedTime)}</Badge>
            </div>
          )}
        </div>
        <div className="flex w-full items-center gap-2">
          {currentActiveSession ? (
            <>
              <FeatherGitPullRequest className="text-body font-body text-brand-600" />
              <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                {currentActiveSession.title}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="destructive-primary">End Session</Button>
              </div>
            </>
          ) : (
            <>
              <FeatherSearch className="text-body font-body text-brand-600" />
              <input
                type="text"
                placeholder="Search for an issue to start working on..."
                className="grow shrink-0 basis-0 text-body font-body text-default-font bg-transparent border-none outline-none placeholder:text-neutral-400"
              />
              <div className="flex items-center gap-2">
                <Button variant="brand-primary">Start Session</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export const ActiveSessionCard = ActiveSessionCardRoot;

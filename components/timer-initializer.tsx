"use client";

import { useEffect, useRef } from "react";
import { useTimerStore } from "@/store/timer-store";

export function TimerInitializer() {
  const { issues, activeIssueId, updateIssueTime } = useTimerStore();
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle timer logic
  useEffect(() => {
    const activeIssue = issues.find(issue => issue.id === activeIssueId);

    if (activeIssue?.isRunning) {
      startTimeRef.current = Date.now() - activeIssue.elapsedTime * 1000;
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          updateIssueTime(activeIssueId!, elapsed);
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [issues, activeIssueId, updateIssueTime]);

  // This component doesn't render anything
  return null;
}

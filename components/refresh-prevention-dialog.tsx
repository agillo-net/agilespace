"use client";

import { useEffect } from "react";
import { useTimerStore } from "@/store/timer-store";

export function RefreshPreventionDialog() {
    const { issues, activeIssueId } = useTimerStore();

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const isRunning = issues.some(issue => issue.isRunning);
            const activeIssue = issues.find(issue => issue.id === activeIssueId);

            // If there is an active issue and the timer is running, show the dialog
            // This will trigger the browser's default confirmation dialog
            if (isRunning && activeIssue) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [issues, activeIssueId]);

    // This component doesn't render anything
    return null;
} 

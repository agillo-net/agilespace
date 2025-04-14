"use client";

import { useEffect } from "react";
import { useTimerStore } from "@/store/timer-store";

export function RefreshPreventionDialog() {
    const { isRunning, activeIssue } = useTimerStore();

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isRunning && activeIssue) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isRunning, activeIssue]);

    // This component doesn't render anything
    return null;
} 
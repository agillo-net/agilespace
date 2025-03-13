"use client";

import { useEffect, useRef } from "react";
import { useTimerStore } from "@/store/timer-store";

export function TimerInitializer() {
  const { isRunning, elapsedTime, setElapsedTime } = useTimerStore();
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle timer logic
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTime * 1000;
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedTime(elapsed);
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
  }, [isRunning, elapsedTime, setElapsedTime]);

  // This component doesn't render anything
  return null;
}

'use client';

import { Play, Pause, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTimer } from '@/contexts/timer-context';
import { formatTime } from '@/lib/format-time';

export function TaskTimer({ className }: { className?: string }) {
  const { isRunning, elapsedTime, activeIssue, toggleTimer, stopTracking } = useTimer();

  if (!activeIssue) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {activeIssue && (
        <a 
          href={activeIssue.url} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm truncate max-w-[200px] hover:underline"
        >
          {activeIssue.title}
        </a>
      )}
      <span className="font-mono text-sm">
        {formatTime(elapsedTime)}
      </span>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleTimer} 
        className="h-8 w-8"
        aria-label={isRunning ? "Pause timer" : "Start timer"}
      >
        {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={stopTracking}
        className="h-8 w-8 text-destructive"
        aria-label="Stop tracking"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

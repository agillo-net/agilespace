"use client";

import { IssueSearch } from "@/components/issue-search";
import { useTimerStore } from "@/store/timer-store";
import { formatTime } from "@/lib/format-time";
import { Pause, Play, Square, ExternalLink as ExternalLinkIcon } from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/external-link";

function ActiveSessionCard() {
  const { issues, activeIssueId, toggleTimer, stopTracking } = useTimerStore();
  
  const activeIssue = issues.find(issue => issue.id === activeIssueId);
  if (!activeIssue) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          <div className="flex items-center gap-2">
            Current Session
            <ExternalLink href={activeIssue.url} title="Open in GitHub" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-xl font-medium">{activeIssue.title}</div>
          <div className="flex justify-center">
            <div className="text-4xl font-mono">{formatTime(activeIssue.elapsedTime)}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center space-x-2">
        <Button 
          onClick={toggleTimer}
          className="w-32"
          variant={activeIssue.isRunning ? "outline" : "default"}
        >
          {activeIssue.isRunning ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </>
          )}
        </Button>
        <Button 
          onClick={stopTracking} 
          className="w-32"
          variant="secondary"
        >
          <Square className="mr-2 h-4 w-4" />
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Dashboard() {
  return (
    <div className="container mx-auto py-6">
      <ActiveSessionCard />
      <IssueSearch />
    </div>
  );
}

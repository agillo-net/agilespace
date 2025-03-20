"use client";

import { useTimerStore } from "@/store/timer-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleDot } from "lucide-react";

interface Issue {
  id: number;
  title: string;
  html_url: string;
  state: string;
  updated_at: string;
  repository_url: string;
  user: {
    login: string;
    avatar_url?: string;
  };
  assignees?: {
    login: string;
    avatar_url?: string;
  }[];
}

interface IssueListProps {
  issues: Issue[];
  loading: boolean;
}

export function IssueList({ issues, loading }: IssueListProps) {
  const { startTracking } = useTimerStore();

  const handleStartTracking = (issue: Issue) => {
    startTracking({
      id: issue.id,
      title: issue.title,
      url: issue.html_url,
    });
  };
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 border rounded-md"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-3 w-[200px]" />
              </div>
              <Skeleton className="h-8 w-[100px]" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!issues.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No issues found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No matching issues were found. Try a different search query.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues ({issues.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {issues.map((issue) => {
          // Extract repository name from URL
          const repoUrl = issue.repository_url;
          const repoName = repoUrl.split("/").slice(-2).join("/");

          // Format date
          const updatedDate = new Date(issue.updated_at).toLocaleDateString();

          return (
            <div
              key={issue.id}
              className="flex justify-between items-center p-4 border rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-2">
                <h3 className="font-medium flex gap-x-2 items-center">
                  <span>
                    {issue.state === "open" ? (
                      <span className="text-green-600 dark:text-green-400">
                        <CircleDot size={16} />
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        <CircleDot size={16} />
                      </span>
                    )}
                  </span>
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {issue.title}
                  </a>
                </h3>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-2 items-center">
                  <span>{repoName}</span>
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-2 items-center">
                  <span>Updated {updatedDate}</span>
                </div>
              </div>
              <div className="flex flex-col h-20 justify-between items-end">
                {issue.assignees && issue.assignees.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {issue.assignees.map((assignee, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger>
                          {assignee.avatar_url && (
                            <Image
                              src={assignee.avatar_url}
                              alt={`${assignee.login}'s avatar`}
                              width={20}
                              height={20}
                              className="rounded-full object-cover"
                            />
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>{assignee.login}</span>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                )}

                <div className="flex-1"></div>

                <button
                  onClick={() => handleStartTracking(issue)}
                  className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Track Time
                </button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

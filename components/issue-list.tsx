"use client";

import Link from "next/link";
import { ExternalLink } from "@/components/ui/external-link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GitHubIssue } from "@/store/github-store";

interface IssueListProps {
  issues: GitHubIssue[];
  loading: boolean;
}

export function IssueList({ issues, loading }: IssueListProps) {
  if (loading) {
    return (
      <div className="mt-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border rounded-md p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-5 w-80" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="mt-6 text-center py-16 text-muted-foreground">
        No issues found. Try adjusting your search query.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {issues.map((issue) => (
        <div key={issue.id} className="border rounded-md p-4 hover:bg-muted/50">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-medium">
                <ExternalLink href={issue.url}>
                  {issue.title}
                </ExternalLink>
              </h3>
              <div className="text-sm text-muted-foreground">
                {issue.repo.owner}/{issue.repo.name} #{issue.number} opened on{" "}
                {new Date(issue.created_at).toLocaleDateString()}
              </div>
            </div>
            <Badge variant={issue.state === "OPEN" ? "default" : "secondary"}>
              {issue.state.toLowerCase()}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

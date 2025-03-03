'use client';

import { useState } from 'react';
import { Star, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskTimer } from '@/components/task-timer';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface GithubIssue {
  id: number;
  title: string;
  html_url: string;
  number: number;
  state: string;
  updated_at: string;
  repository_url?: string;
  url?: string;
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
}

interface IssueListProps {
  issues: GithubIssue[];
  loading?: boolean;
}

export function IssueList({ issues, loading = false }: IssueListProps) {
  const [activeIssueId, setActiveIssueId] = useState<number | null>(null);

  const handleToggleTimer = (issueId: number) => {
    setActiveIssueId(activeIssueId === issueId ? null : issueId);
  };
  
  // Helper function to extract repository name from GitHub URLs
  const getRepositoryInfo = (issue: GithubIssue) => {
    // Extract from repository_url (e.g., "https://api.github.com/repos/owner/repo")
    if (issue.repository_url) {
      const parts = issue.repository_url.split('/');
      if (parts.length >= 2) {
        const repoName = parts.pop();
        const ownerName = parts.pop();
        return `${ownerName}/${repoName}`;
      }
    }
    
    // Extract from html_url (e.g., "https://github.com/owner/repo/issues/123")
    if (issue.html_url) {
      const urlParts = issue.html_url.split('/');
      // Format is usually: https://github.com/owner/repo/issues/number
      if (urlParts.length >= 5) {
        return `${urlParts[3]}/${urlParts[4]}`;
      }
    }
    
    return "Unknown repository";
  };

  if (loading) {
    return (
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  console.log(JSON.stringify(issues, null, 2));

  if (!issues.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium">No issues found</h3>
        <p className="text-muted-foreground mt-2">
          Try adjusting your search query or select a different organization
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {issues.map((issue) => (
        <Card key={issue.id} className="overflow-hidden">
          <div className="p-4 flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h3 className="font-medium line-clamp-2">
                  <a 
                    href={issue.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:underline flex items-center gap-1"
                  >
                    {issue.title}
                    <ExternalLink className="h-3 w-3 inline opacity-50" />
                  </a>
                </h3>
                <Badge variant={issue.state === "open" ? "default" : "outline"}>
                  {issue.state}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground mt-1">
                {getRepositoryInfo(issue)} #{issue.number}
              </div>

              {issue.labels && issue.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {issue.labels.map((label) => (
                    <Badge 
                      key={label.id} 
                      variant="outline" 
                      className="text-xs"
                      style={{
                        borderColor: `#${label.color}`,
                        backgroundColor: `#${label.color}10`
                      }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className={cn("flex flex-col items-center", {
              "min-w-[100px]": activeIssueId === issue.id
            })}>
              <Button
                size="sm"
                variant="ghost"
                className={cn("rounded-full", {
                  "text-primary": activeIssueId === issue.id
                })}
                onClick={() => handleToggleTimer(issue.id)}
              >
                <Star className={cn("h-5 w-5", {
                  "fill-primary": activeIssueId === issue.id
                })} />
                <span className="sr-only">
                  {activeIssueId === issue.id ? "Stop tracking" : "Start tracking"}
                </span>
              </Button>
              
              {activeIssueId === issue.id && (
                <div className="mt-2">
                  <TaskTimer className="flex-col" />
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { CircleIcon, CircleDotIcon, SearchIcon } from "lucide-react";
import { useDebounce } from "use-debounce";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Import from the new GitHub client structure
import { client as githubClient } from "@/lib/github";
import {
  GitHubIssue,
  GitHubLabel,
  GitHubUser,
  SearchOptions,
} from "@/lib/github/types";

type IssueState = "open" | "closed" | "all";

const labelColors: Record<string, { color: string; textColor: string }> = {
  bug: { color: "#d73a4a", textColor: "#ffffff" },
  documentation: { color: "#0075ca", textColor: "#ffffff" },
  enhancement: { color: "#a2eeef", textColor: "#000000" },
  "good first issue": { color: "#7057ff", textColor: "#ffffff" },
  "help wanted": { color: "#008672", textColor: "#ffffff" },
  invalid: { color: "#e4e669", textColor: "#000000" },
  question: { color: "#d876e3", textColor: "#ffffff" },
  wontfix: { color: "#ffffff", textColor: "#000000" },
  DevOps: { color: "#ff9900", textColor: "#000000" },
  "Project Management": { color: "#1d76db", textColor: "#ffffff" },
  Spike: { color: "#fbca04", textColor: "#000000" },
  "Features backlog": { color: "#0e8a16", textColor: "#ffffff" },
  Admin: { color: "#5319e7", textColor: "#ffffff" },
  Web: { color: "#006b75", textColor: "#ffffff" },
  // Add more colors as needed
};

function getLabelStyle(labelName: string, color?: string) {
  const labelConfig = labelColors[labelName] || {
    color: color || "#eeeeee",
    textColor: color && isLightColor(color) ? "#000000" : "#ffffff",
  };

  return {
    backgroundColor: labelConfig.color,
    color: labelConfig.textColor,
  };
}

// Helper to determine if we should use dark text on a light background
function isLightColor(color: string): boolean {
  // Remove the hash character if present
  const hex = color.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate brightness (https://www.w3.org/TR/AERT/#color-contrast)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Brightness > 128 is considered light
  return brightness > 125;
}

// Format date to a readable string
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays <= 30) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

// Extract repository name from URL
function getRepoNameFromUrl(url: string): string {
  const parts = url.split("/");
  if (parts.length >= 5) {
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  }
  return url;
}

export default function GitHubIssuesSearch() {
  const [searchQuery, setSearchQuery] = useState("is:issue");
  const [debouncedQuery] = useDebounce(searchQuery, 500);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [state, setState] = useState<IssueState>("open");
  const [sortBy, setSortBy] = useState<"created" | "updated" | "comments">(
    "updated"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [onlyAssigned, setOnlyAssigned] = useState<boolean>(false);

  // Search issues when the query changes
  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      try {
        // Build search query
        let query = debouncedQuery;

        // Add state filter if not in the query already
        if (!query.includes("is:open") && !query.includes("is:closed")) {
          query += ` is:${state}`;
        }

        // Add assigned filter if needed
        if (onlyAssigned && !query.includes("assignee:")) {
          query += " assignee:@me";
        }

        const searchOptions: SearchOptions = {
          sort: sortBy,
          order: sortOrder,
          per_page: 20,
        };

        const result = await githubClient.searchIssues(query, searchOptions);

        // The new client already handles formatting the repository data
        setIssues(result.items);
      } catch (error) {
        console.error("Error fetching GitHub issues:", error);
        setIssues([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [debouncedQuery, state, sortBy, sortOrder, onlyAssigned]);

  // Handle starting a work session for an issue
  const handleStartSession = (issue: GitHubIssue) => {
    console.log("Starting work session for issue:", issue);
    // Add your logic to start a work session here
    // This could involve opening a modal or navigating to a timer page
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues by title, body, or any keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={state}
            onValueChange={(value) => setState(value as IssueState)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(value) =>
              setSortBy(value as "created" | "updated" | "comments")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Created Date</SelectItem>
              <SelectItem value="updated">Updated Date</SelectItem>
              <SelectItem value="comments">Comments</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortOrder}
            onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="assigned-to-me"
              checked={onlyAssigned}
              onCheckedChange={(checked) => setOnlyAssigned(checked === true)}
            />
            <label
              htmlFor="assigned-to-me"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Assigned to me
            </label>
          </div>
        </div>
      </div>
      <Separator />

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <p>Loading issues...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="flex items-center justify-center h-24">
          <p>No issues found matching your search criteria.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="text-right">Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id} className="hover:bg-muted/50">
                <TableCell>
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {issue.title}
                  </a>
                  <div className="text-xs text-muted-foreground">
                    #{issue.number} opened {formatDate(issue.created_at)}
                    {issue.repository && (
                      <span className="ml-2">
                        in {issue.repository.full_name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {issue.state === "open" ? (
                      <CircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <CircleDotIcon className="h-4 w-4 text-purple-500" />
                    )}
                    <span className="capitalize">{issue.state}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {issue.assignees && issue.assignees.length > 0 ? (
                    <div className="flex -space-x-2">
                      {issue.assignees.slice(0, 3).map((assignee) => (
                        <Avatar
                          key={assignee.login}
                          className="h-6 w-6 border-2 border-background"
                        >
                          <AvatarImage
                            src={assignee.avatar_url}
                            alt={assignee.login}
                          />
                          <AvatarFallback>
                            {assignee.login.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {issue.assignees.length > 3 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          +{issue.assignees.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No assignees
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {formatDate(issue.updated_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartSession(issue)}
                    className="h-8"
                  >
                    Start Session
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

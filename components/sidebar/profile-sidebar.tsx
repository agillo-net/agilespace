import * as React from "react";
import Link from "next/link";
import { CircleAlert, GitPullRequest } from "lucide-react";
import { CollapsibleSection } from "@/components/sidebar/collapsible-section";

// Replace 'any' with more specific types
interface UserData {
  login: string;
  avatar_url?: string;
  name?: string;
  // Add other properties as needed
}

interface ProfileSidebarProps {
  issues: {
    id: number;
    html_url: string;
    number: number;
    title: string;
    repository?: {
      owner: UserData;
      name: string;
    };
  }[];
  pullRequests: {
    id: number;
    html_url: string;
    number: number;
    title: string;
    repository_url: string;
  }[];
  expandedSections: {
    issues: boolean;
    pullRequests: boolean;
    [key: string]: boolean;
  };
  toggleSection: (
    section: "issues" | "pullRequests" | "repositories" | "projects" | "teams"
  ) => void;
}

export function ProfileSidebar({
  issues,
  pullRequests,
  expandedSections,
  toggleSection,
}: ProfileSidebarProps) {
  return (
    <div className="space-y-0">
      {/* Assigned Issues Section */}
      <CollapsibleSection
        title="Assigned Issues"
        icon={CircleAlert}
        count={issues.length}
        isOpen={expandedSections.issues}
        onToggle={() => toggleSection("issues")}
      >
        <div className="pl-10 pr-4 pb-3 space-y-1">
          {issues.length > 0 ? (
            issues.map((issue) => (
              <Link
                key={issue.id}
                href={issue.html_url}
                target="_blank"
                className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate"
              >
                <div className="flex items-center gap-1">
                  <span className="truncate flex-1">
                    {issue.repository
                      ? `${issue.repository.owner.login}/${issue.repository.name}`
                      : ""}
                    #{issue.number}: {issue.title}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-2">
              No assigned issues found
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Review Requests Section */}
      <CollapsibleSection
        title="Review Requests"
        icon={GitPullRequest}
        count={pullRequests.length}
        isOpen={expandedSections.pullRequests}
        onToggle={() => toggleSection("pullRequests")}
        className="last:border-b-0"
      >
        <div className="pl-10 pr-4 pb-3 space-y-1">
          {pullRequests.length > 0 ? (
            pullRequests.map((pr) => (
              <Link
                key={pr.id}
                href={pr.html_url}
                target="_blank"
                className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate"
              >
                <div className="flex items-center gap-1">
                  <span className="truncate flex-1">
                    {pr.repository_url
                      ? pr.repository_url.replace(
                          "https://api.github.com/repos/",
                          ""
                        )
                      : ""}
                    #{pr.number}: {pr.title}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-2">
              No review requests found
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

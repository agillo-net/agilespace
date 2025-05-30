import * as React from "react";
import Link from "next/link";
import { Code, FolderKanban, Users } from "lucide-react";
import { CollapsibleSection } from "@/components/sidebar/collapsible-section";
import { ExternalLink } from "@/components/ui/external-link";

// Replace 'any' with more specific types
interface Repository {
  id: number;
  name: string;
  html_url: string;
  // Add other properties as needed
}

interface Team {
  id: number;
  name: string;
  slug: string;
  // Add other properties as needed
}

interface OrganizationSidebarProps {
  repos: Repository[];
  projects: { 
    id: number;
    title: string;
    url: string;
    // Add other properties as needed
  }[]; // Replace 'any[]' with a specific type
  teams: Team[];
  expandedSections: {
    repositories: boolean;
    projects: boolean;
    teams: boolean;
    [key: string]: boolean;
  };
  toggleSection: (
    section: "repositories" | "projects" | "teams" | "issues" | "pullRequests"
  ) => void;
  orgName: string;
}

export function OrganizationSidebar({
  repos,
  projects,
  teams,
  expandedSections,
  toggleSection,
  orgName,
}: OrganizationSidebarProps) {
  return (
    <div className="space-y-0">
      {/* Repositories Section */}
      <CollapsibleSection
        title="Repositories"
        icon={Code}
        count={repos.length}
        isOpen={expandedSections.repositories}
        onToggle={() => toggleSection("repositories")}
      >
        <div className="pl-10 pr-4 pb-3 space-y-1">
          {repos.length > 0 ? (
            repos.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between pr-1"
              >
                <Link
                  href={`/orgs/${orgName}/repos/${repo.name}`}
                  className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate flex-1"
                >
                  {repo.name}
                </Link>
                <ExternalLink href={repo.html_url} title="Open in GitHub" />
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-2">
              No repositories found
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Projects Section */}
      <CollapsibleSection
        title="Projects"
        icon={FolderKanban}
        count={projects.length}
        isOpen={expandedSections.projects}
        onToggle={() => toggleSection("projects")}
      >
        <div className="pl-10 pr-4 pb-3 space-y-1">
          {projects.length > 0 ? (
            projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between pr-1"
              >
                <Link
                  href={`/orgs/${orgName}/projects/${project.id}`}
                  className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate flex-1"
                >
                  {project.title}
                </Link>
                <ExternalLink href={project.url} title="Open in GitHub" />
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-2">
              No projects found
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Teams Section */}
      <CollapsibleSection
        title="Teams"
        icon={Users}
        count={teams.length}
        isOpen={expandedSections.teams}
        onToggle={() => toggleSection("teams")}
        className="last:border-b-0"
      >
        <div className="pl-10 pr-4 pb-3 space-y-1">
          {teams.length > 0 ? (
            teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between pr-1"
              >
                <Link
                  href={`/orgs/${orgName}/teams/${team.slug}`}
                  className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate flex-1"
                >
                  {team.name}
                </Link>
                <ExternalLink href={`https://github.com/orgs/${orgName}/teams/${team.slug}`} title="Open in GitHub" />
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-2">
              No teams found
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

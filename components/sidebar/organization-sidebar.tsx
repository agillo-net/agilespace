import * as React from "react";
import Link from "next/link";
import { Code, FolderKanban, Users } from "lucide-react";
import { CollapsibleSection } from "@/components/sidebar/collapsible-section";

interface OrganizationSidebarProps {
  repos: any[];
  projects: any[];
  teams: any[];
  expandedSections: {
    repositories: boolean;
    projects: boolean;
    teams: boolean;
    [key: string]: boolean;
  };
  toggleSection: (section: string) => void;
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
                  href={`/org/${orgName}/${repo.name}`}
                  className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate flex-1"
                >
                  {repo.name}
                </Link>
                <Link
                  href={repo.html_url}
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground p-1 rounded-full"
                  title="Open in GitHub"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </Link>
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
              <Link
                key={project.id}
                href={project.html_url}
                target="_blank"
                className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate"
              >
                {project.name}
              </Link>
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
              <Link
                key={team.id}
                href={`https://github.com/orgs/${orgName}/teams/${team.slug}`}
                target="_blank"
                className="block py-1.5 px-2 rounded text-sm hover:bg-primary/10 truncate"
              >
                {team.name}
              </Link>
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

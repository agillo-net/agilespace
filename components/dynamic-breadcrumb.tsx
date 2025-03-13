"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useGithubStore } from "@/store/github-store";
import { useRepositoryStore } from "@/store/repository-store";

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const { organizations } = useGithubStore();
  const { repository, organizationDetails } = useRepositoryStore();
  
  // Don't show anything on the root path
  if (pathname === "/") return null;

  // Split the path into segments
  const pathSegments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, segments) => {
      // Create the path up to and including this segment
      const path = `/${segments.slice(0, index + 1).join("/")}`;
      
      // Format the segment name
      let name = segment;
      
      // Check if this segment matches an organization name
      if (index === 0) {
        const matchedOrg = organizations.find(org => org.login === segment);
        if (matchedOrg) {
          name = matchedOrg.login;
        } else if (organizationDetails && organizationDetails.login === segment) {
          name = organizationDetails.login;
        }
      }
      
      // Check if this segment matches a repository name
      if (index === 1 && repository && repository.name === segment) {
        name = repository.name;
      }
      
      return { name, path };
    });

  return (
    <div className="flex items-center text-sm">
      <Link 
        href="/" 
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {pathSegments.map((segment, index) => (
        <React.Fragment key={segment.path}>
          <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
          <Link
            href={segment.path}
            className={index === pathSegments.length - 1 
              ? "font-medium" 
              : "text-muted-foreground hover:text-foreground"
            }
          >
            {segment.name}
          </Link>
        </React.Fragment>
      ))}
    </div>
  );
}

"use client";

import * as React from "react";
import { GitHubOrg, GitHubUser, client } from "@/lib/github";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User } from "next-auth";

interface Organization {
  id: string;
  name: string;
  github_org_id: string | null;
}

interface OrganizationMember {
  organization_id: string;
  user_id: string;
}

export default function Dashboard() {
  const [orgs, setOrgs] = React.useState<GitHubOrg[]>([]);
  const [dbOrgs, setDbOrgs] = React.useState<Organization[]>([]);
  const [membershipMap, setMembershipMap] = React.useState<
    Record<string, boolean>
  >({});
  const [isCreating, setIsCreating] = React.useState<string | null>(null);
  const [isJoining, setIsJoining] = React.useState<string | null>(null);
  const supabase = createClient();

  const [user, setUser] = React.useState<User>();
  React.useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  React.useEffect(() => {
    const fetchOrgs = async () => {
      // Fetch GitHub organizations
      const fetchedOrgs = await client.getUserOrgs();
      setOrgs(fetchedOrgs);

      // Fetch database organizations
      const { data: organizations } = await supabase
        .from("organizations")
        .select("*");
      setDbOrgs(organizations || []);

      // Fetch user memberships
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id");

      const membershipObject = (memberships || []).reduce((acc, curr) => {
        acc[curr.organization_id] = true;
        return acc;
      }, {} as Record<string, boolean>);

      setMembershipMap(membershipObject);
    };

    fetchOrgs();
  }, []);

  const handleCreateOrg = async (githubOrg: GitHubOrg) => {
    setIsCreating(githubOrg.id.toString());
    try {
      const { error } = await supabase.rpc("create_organization", {
        p_name: githubOrg.login,
        p_github_org_id: githubOrg.id.toString(),
        p_github_org_name: githubOrg.login,
      });

      if (error) throw error;

      // Refresh organizations
      const { data: organizations } = await supabase
        .from("organizations")
        .select("*");
      setDbOrgs(organizations || []);
    } catch (error) {
      console.error("Error creating organization:", error);
    } finally {
      setIsCreating(null);
    }
  };

  const handleJoinOrg = async (org: Organization) => {
    setIsJoining(org.id);
    try {
      const { error } = await supabase.from("organization_members").insert([
        {
          organization_id: org.id,
          user_id: user?.id,
          role: "member",
        },
      ]);

      if (error) throw error;

      setMembershipMap((prev) => ({
        ...prev,
        [org.id]: true,
      }));
    } catch (error) {
      console.error("Error joining organization:", error);
    } finally {
      setIsJoining(null);
    }
  };

  const isOrgLinked = (githubOrg: GitHubOrg) => {
    return dbOrgs.some((org) => org.github_org_id === githubOrg.id.toString());
  };

  const getOrgByGithubId = (githubOrg: GitHubOrg): Organization | undefined => {
    return dbOrgs.find((org) => org.github_org_id === githubOrg.id.toString());
  };

  const isMember = (orgId: string): boolean => {
    return membershipMap[orgId] || false;
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Organizations
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect and manage your GitHub organizations
          </p>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableBody>
              {orgs.map((org) => {
                const dbOrg = getOrgByGithubId(org);
                const isLinked = isOrgLinked(org);
                const isMemberOfOrg = dbOrg ? isMember(dbOrg.id) : false;

                return (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={org.avatar_url}
                          alt={`${org.login} avatar`}
                          className="w-8 h-8 rounded-md"
                        />
                        <div className="flex flex-col">
                          <div className="font-medium">
                            {isMemberOfOrg ? (
                              <Link
                                href={`/dashboard/${org.login}`}
                                className="hover:text-blue-600 hover:underline"
                              >
                                {org.login}
                              </Link>
                            ) : (
                              <span>{org.login}</span>
                            )}
                          </div>
                          <a
                            href={`https://github.com/${org.login}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-blue-600 flex items-center gap-1"
                          >
                            View on GitHub
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {!isLinked ? (
                        <Badge variant="outline">Not connected</Badge>
                      ) : isMemberOfOrg ? (
                        <Badge variant="default" className="bg-green-600">
                          Member
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Available to join</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isLinked ? (
                        <Button
                          onClick={() => handleCreateOrg(org)}
                          disabled={isCreating === org.id.toString()}
                          size="sm"
                        >
                          {isCreating === org.id.toString()
                            ? "Connecting..."
                            : "Connect"}
                        </Button>
                      ) : dbOrg && !isMemberOfOrg ? (
                        <Button
                          onClick={() => handleJoinOrg(dbOrg)}
                          disabled={isJoining === dbOrg.id}
                          variant="outline"
                          size="sm"
                        >
                          {isJoining === dbOrg.id ? "Joining..." : "Join"}
                        </Button>
                      ) : isMemberOfOrg ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/${org.login}`}>
                            View Dashboard
                          </Link>
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

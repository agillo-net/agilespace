"use client";

import { useEffect } from "react";
import { useGithubStore } from "@/store/github-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink } from "@/components/ui/external-link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const {
    user,
    repos,
    orgs,
    isLoadingUser,
    isLoadingRepos,
    isLoadingOrgs,
    userError,
    reposError,
    orgsError,
    fetchUserProfile,
    fetchUserRepos,
    fetchUserOrgs,
  } = useGithubStore();

  useEffect(() => {
    // Fetch user profile and related data when component mounts
    fetchUserProfile();
    fetchUserRepos();
    fetchUserOrgs();
  }, [fetchUserProfile, fetchUserRepos, fetchUserOrgs]);

  return (
    <div className="flex flex-1">
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold mb-8">Profile</h1>

          {/* User Profile */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>GitHub Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingUser ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              ) : userError ? (
                <div className="text-destructive">Error: {userError}</div>
              ) : user ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatarUrl} alt={user.login} />
                    <AvatarFallback>
                      {user.login.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    <p className="text-muted-foreground">@{user.login}</p>
                    <ExternalLink
                      href={user.url}
                      className="mt-2"
                      title="View on GitHub"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  No profile data available. Please login with GitHub.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizations */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOrgs ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : orgsError ? (
                <div className="text-destructive">Error: {orgsError}</div>
              ) : orgs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {orgs.map((org) => (
                    <Card key={org.login} className="overflow-hidden">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={org.avatarUrl} alt={org.login} />
                          <AvatarFallback>
                            {org.login.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{org.name || org.login}</p>
                          <ExternalLink
                            href={org.url}
                            className="text-sm text-muted-foreground"
                            title={`@${org.login}`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">
                  No organizations found.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Repositories */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Repositories</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRepos ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : reposError ? (
                <div className="text-destructive">Error: {reposError}</div>
              ) : repos.length > 0 ? (
                <div className="divide-y">
                  {repos.slice(0, 10).map((repo) => (
                    <div key={repo.id} className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            <ExternalLink
                              href={repo.url}
                              title={`${repo.owner}/${repo.name}`}
                            />
                          </h3>
                          {repo.description && (
                            <p className="text-muted-foreground text-sm mt-1">
                              {repo.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            ⭐ {repo.stargazerCount}
                          </Badge>
                          <Badge variant="outline">🍴 {repo.forkCount}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">
                  No repositories found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </div>
  );
}

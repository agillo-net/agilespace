"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGithubStore } from "@/store/github-store";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const router = useRouter();
  const { orgs, isLoadingOrgs, orgsError, fetchUserOrgs } = useGithubStore();

  useEffect(() => {
    fetchUserOrgs();
  }, [fetchUserOrgs]);

  const handleOrgSelect = (orgName: string) => {
    router.push(`/dashboard/${orgName}`);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        Your GitHub Organizations
      </h1>

      {orgsError && (
        <div className="mt-6 p-4 border border-red-300 bg-red-50 text-red-700 rounded-md">
          <p className="font-medium">Error fetching organizations:</p>
          <p>{orgsError}</p>
        </div>
      )}

      {isLoadingOrgs && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      {!isLoadingOrgs && orgs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          You don't have access to any GitHub organizations.
        </div>
      )}

      {!isLoadingOrgs && orgs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {orgs.map((org) => (
            <Card
              key={org.login}
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOrgSelect(org.login)}
            >
              <div className="flex items-center space-x-4">
                <img
                  src={org.avatarUrl}
                  alt={`${org.name} logo`}
                  className="h-12 w-12 rounded-full"
                />
                <div>
                  <h3 className="font-medium">{org.name}</h3>
                  <p className="text-sm text-muted-foreground">{org.login}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

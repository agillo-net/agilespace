"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useGithubStore } from "@/store/github-store";
import { useUIStore } from "@/store/ui-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OrgSwitcher() {
  const router = useRouter();
  const { orgs, isLoadingOrgs, fetchUserOrgs } = useGithubStore();
  const { activeOrganization, setActiveOrganization } = useUIStore();

  React.useEffect(() => {
    fetchUserOrgs();
  }, [fetchUserOrgs]);

  const handleOrgChange = (orgLogin: string) => {
    setActiveOrganization(orgLogin);
    router.push(`/orgs/${orgLogin}`);
  };

  return (
    <Select value={activeOrganization ?? undefined} onValueChange={handleOrgChange}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select organization">
          <div className="flex items-center gap-2">
            {activeOrganization && (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={orgs.find(org => org.login === activeOrganization)?.avatarUrl}
                    alt={activeOrganization}
                  />
                  <AvatarFallback className="text-xs">
                    {activeOrganization.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{activeOrganization}</span>
              </>
            )}
            {!activeOrganization && "Select organization"}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Organizations</SelectLabel>
          {isLoadingOrgs ? (
            <SelectItem value="loading" disabled>
              Loading...
            </SelectItem>
          ) : orgs.length === 0 ? (
            <SelectItem value="none" disabled>
              No organizations found
            </SelectItem>
          ) : (
            orgs.map((org) => (
              <SelectItem key={org.login} value={org.login}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={org.avatarUrl} alt={org.name || org.login} />
                    <AvatarFallback className="text-xs">
                      {(org.name || org.login).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{org.name || org.login}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

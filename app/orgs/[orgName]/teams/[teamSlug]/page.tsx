"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useGithubStore } from "@/store/github-store";
import { fetchTeamMembers } from "@/lib/api-services";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function TeamPage() {
  const params = useParams();
  const orgName = params.orgName as string;
  const teamSlug = params.teamSlug as string;
  
  const {
    teamMembers,
    isLoadingTeamMembers,
    teamMembersError,
    setTeamMembers,
    setIsLoadingTeamMembers,
    setTeamMembersError,
    resetTeamMembersState,
  } = useGithubStore();

  useEffect(() => {
    async function loadTeamMembers() {
      if (!orgName || !teamSlug) return;
      
      setIsLoadingTeamMembers(true);
      setTeamMembersError(null);
      
      try {
        const members = await fetchTeamMembers(orgName, teamSlug);
        setTeamMembers(members);
      } catch (error) {
        console.error("Error loading team members:", error);
        setTeamMembersError(error instanceof Error ? error.message : "Failed to load team members");
      } finally {
        setIsLoadingTeamMembers(false);
      }
    }

    loadTeamMembers();
    
    // Clean up when unmounting
    return () => {
      resetTeamMembersState();
    };
  }, [orgName, teamSlug, setTeamMembers, setIsLoadingTeamMembers, setTeamMembersError, resetTeamMembersState]);
  
  function getInitials(login: string) {
    return login.slice(0, 2).toUpperCase();
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {teamSlug} Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembersError ? (
            <div className="text-red-500 p-4">
              Error: {teamMembersError}
            </div>
          ) : isLoadingTeamMembers ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No team members found
                    </TableCell>
                  </TableRow>
                ) : (
                  teamMembers.map((member) => (
                    <TableRow key={member.login}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={member.avatar_url} alt={member.login} />
                          <AvatarFallback>{getInitials(member.login)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>{member.login}</TableCell>
                      <TableCell>{member.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === "admin" ? "destructive" : "secondary"}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={member.html_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View Profile
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

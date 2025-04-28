"use client";

import React from "react";
import GitHubIssuesSearch from "./github-issues-search";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function IssueSearch() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>Assigned to me</CardTitle>
      </CardHeader>
      <CardContent>
        <GitHubIssuesSearch />
      </CardContent>
    </Card>
  );
}

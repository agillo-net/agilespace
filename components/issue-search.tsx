"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGithubStore } from "@/store/github-store";

interface IssueSearchProps {
  onSearch: (query: string, organization: string) => Promise<void>;
}

export function IssueSearch({ onSearch }: IssueSearchProps) {
  const [query, setQuery] = useState("");
  const [organization, setOrganization] = useState("");
  const { isSearching, organizations } = useGithubStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, organization);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Search GitHub Issues</CardTitle>
        <CardDescription>
          Find issues from your organizations and repositories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:flex-row items-end">
          <div className="flex-1">
            <label htmlFor="query" className="block text-sm font-medium mb-1">
              Search Query
            </label>
            <Input
              id="query"
              placeholder="Type to search issues..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-1/3">
            <label htmlFor="organization" className="block text-sm font-medium mb-1">
              Organization (Optional)
            </label>
            <Select
              value={organization}
              onValueChange={setOrganization}
            >
              <SelectTrigger id="organization">
                <SelectValue placeholder="All organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.login} value={org.login}>
                    {org.login}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search Issues"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

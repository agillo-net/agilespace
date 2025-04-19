"use client";

import { useEffect } from "react";
import { searchIssues } from "@/lib/api-services";
import { useGithubStore } from "@/store/github-store";
import { IssueSearch } from "@/components/issue-search";
import { IssueList } from "@/components/issue-list";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TicketHistory } from "@/components/ticket-history";

export default function Home() {
  const {
    searchResults,
    isSearching,
    hasSearched,
    setSearchResults,
    setIsSearching,
    setHasSearched,
    setSearchError
  } = useGithubStore();

  // Reset search state when component unmounts
  useEffect(() => {
    return () => {
      useGithubStore.getState().resetSearchState();
    };
  }, []);

  const handleSearch = async (query: string, orgs: string[]) => {
    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      const data = await searchIssues(query, orgs);
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching issues:", error);
      setSearchError(error instanceof Error ? error.message : "Failed to search issues");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-1">
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold text-center mb-8">
            GitHub Issue Tracker
          </h1>

          <IssueSearch onSearch={handleSearch} />

          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="h-full">
              <h2 className="text-2xl font-semibold mb-4">Search Results</h2>
              {hasSearched ? (
                <IssueList issues={searchResults} loading={isSearching} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Search for issues above to get started
                </div>
              )}
            </div>
            <div className="h-full">
              <TicketHistory />
            </div>
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}

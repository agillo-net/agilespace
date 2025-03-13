"use client";

import { useEffect } from "react";
import { searchIssues } from "@/lib/api-services";
import { useGithubStore } from "@/store/github-store";
import { IssueSearch } from "@/components/issue-search";
import { IssueList } from "@/components/issue-list";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

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

  const handleSearch = async (query: string, organization: string) => {
    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      // If organization is "all", pass empty string to the API
      const orgParam = organization === "all" ? "" : organization;
      const data = await searchIssues(query, orgParam);
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

          {hasSearched && <IssueList issues={searchResults} loading={isSearching} />}

          {!hasSearched && (
            <div className="text-center py-16 text-muted-foreground">
              Search for issues above to get started
            </div>
          )}
        </div>
      </SidebarInset>
    </div>
  );
}

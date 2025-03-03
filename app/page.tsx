'use client';

import { useState } from 'react';
import { IssueSearch } from '@/components/issue-search';
import { IssueList } from '@/components/issue-list';

export default function Home() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string, organization: string) => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (organization) params.append('org', organization);
      
      const response = await fetch(`/api/github/issues?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      } else {
        console.error('Failed to fetch issues');
      }
    } catch (error) {
      console.error('Error searching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold text-center mb-8">GitHub Issue Tracker</h1>
      
      <IssueSearch onSearch={handleSearch} />
      
      {hasSearched && (
        <IssueList issues={issues} loading={loading} />
      )}
      
      {!hasSearched && (
        <div className="text-center py-16 text-muted-foreground">
          Search for issues above to get started
        </div>
      )}
    </div>
  );
}
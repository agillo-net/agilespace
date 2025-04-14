"use client";

import { useState } from "react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Search, Plus } from "lucide-react";
import { WorkSessionCard } from "@/components/work-session-card";
import { useQuery, useMutation } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { Id } from "@workspace/backend/convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";

// GitHub issue interface
interface GitHubIssue {
  id: string;
  title: string;
  number: number;
  repository: string;
  url: string;
}

export default function TrackerPage() {
  const { isSignedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GitHubIssue[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Convex queries and mutations
  const activeSessions = useQuery(api.workSessions.getActiveForCurrentUser);
  const completedSessions = useQuery(api.workSessions.getCompletedForCurrentUser, { limit: 10 });
  const createSession = useMutation(api.workSessions.create);
  const completeSession = useMutation(api.workSessions.complete);
  const deleteSession = useMutation(api.workSessions.remove);
  const togglePauseSession = useMutation(api.workSessions.togglePause);
  const updateSessionNotes = useMutation(api.workSessions.updateNotes);
  const updateSessionParticipants = useMutation(api.workSessions.updateParticipants);

  // Mock search function for GitHub issues (would be replaced with real GitHub API)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    // In a real app, this would call the GitHub API
    const mockResults: GitHubIssue[] = [
      {
        id: `issue-${Date.now()}-1`,
        title: `Fix bug in ${searchQuery}`,
        number: 123,
        repository: "user/repo",
        url: "https://github.com/user/repo/issues/123"
      },
      {
        id: `issue-${Date.now()}-2`,
        title: `Implement feature for ${searchQuery}`,
        number: 124,
        repository: "user/repo",
        url: "https://github.com/user/repo/issues/124"
      },
      {
        id: `issue-${Date.now()}-3`,
        title: `Review PR related to ${searchQuery}`,
        number: 125,
        repository: "user/repo",
        url: "https://github.com/user/repo/issues/125"
      }
    ];
    
    setSearchResults(mockResults);
    setShowSearchResults(true);
  };

  // Start a new work session using Convex
  const handleStartSession = (issue: GitHubIssue) => {
    createSession({
      issueId: issue.id,
      issueTitle: issue.title,
      issueNumber: issue.number,
      issueRepository: issue.repository,
      issueUrl: issue.url,
    });
    
    setShowSearchResults(false);
    setSearchQuery("");
  };

  // Handler functions for sessions
  const handleCompleteSession = (sessionId: Id<"workSessions">) => {
    completeSession({ id: sessionId });
  };

  const handleDeleteSession = (sessionId: Id<"workSessions">) => {
    deleteSession({ id: sessionId });
  };

  const handleTogglePause = (sessionId: Id<"workSessions">) => {
    togglePauseSession({ id: sessionId });
  };

  const handleNotesChange = (sessionId: Id<"workSessions">, notes: string) => {
    updateSessionNotes({ id: sessionId, notes });
  };

  const handleParticipantsChange = (sessionId: Id<"workSessions">, participants: string[]) => {
    updateSessionParticipants({ id: sessionId, participants });
  };

  // Loading states
  if (!isSignedIn) {
    return <div className="p-8 text-center">Please sign in to use the tracker</div>;
  }

  if (activeSessions === undefined || completedSessions === undefined) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Search GitHub Issues</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="rounded-md border bg-background p-2 mt-2">
            <h3 className="font-medium px-2 py-1.5">Results</h3>
            <div className="space-y-1">
              {searchResults.map((issue) => (
                <div 
                  key={issue.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer"
                  onClick={() => handleStartSession(issue)}
                >
                  <div>
                    <p className="font-medium">{issue.title}</p>
                    <p className="text-xs text-muted-foreground">{issue.repository} #{issue.number}</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4 mr-1" /> Track
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Work Sessions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Work Sessions</h2>
        {activeSessions.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center">
            <h3 className="font-medium text-muted-foreground">No active sessions</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Search for a GitHub issue above to start tracking time
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <WorkSessionCard
                key={session._id}
                session={{
                  id: session._id,
                  issue: {
                    id: session.issueId,
                    title: session.issueTitle,
                    number: session.issueNumber,
                    repository: session.issueRepository,
                    url: session.issueUrl
                  },
                  startTime: new Date(session.startTime),
                  endTime: session.endTime ? new Date(session.endTime) : undefined,
                  duration: session.duration,
                  isActive: session.isActive,
                  isPaused: session.isPaused,
                  notes: session.notes,
                  participants: session.participants
                }}
                isActive={true}
                onComplete={() => handleCompleteSession(session._id)}
                onDelete={() => handleDeleteSession(session._id)}
                onTogglePause={() => handleTogglePause(session._id)}
                onNotesChange={(notes) => handleNotesChange(session._id, notes)}
                onParticipantsChange={(participants) => handleParticipantsChange(session._id, participants)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Work Sessions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Completed Work Sessions</h2>
        {completedSessions.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center">
            <h3 className="font-medium text-muted-foreground">No completed sessions</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Completed sessions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {completedSessions.map((session) => (
              <WorkSessionCard
                key={session._id}
                session={{
                  id: session._id,
                  issue: {
                    id: session.issueId,
                    title: session.issueTitle,
                    number: session.issueNumber,
                    repository: session.issueRepository,
                    url: session.issueUrl
                  },
                  startTime: new Date(session.startTime),
                  endTime: session.endTime ? new Date(session.endTime) : undefined,
                  duration: session.duration,
                  isActive: session.isActive,
                  isPaused: session.isPaused,
                  notes: session.notes,
                  participants: session.participants
                }}
                isActive={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
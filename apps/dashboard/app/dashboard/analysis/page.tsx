"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@clerk/nextjs";

// Helper function to format time from milliseconds
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours}h ${minutes}m ${seconds}s`;
};

export default function AnalysisPage() {
  const { isSignedIn } = useAuth();
  const [timeRange, setTimeRange] = useState<'today' | 'twoWeeks' | 'month'>('today');
  
  // Calculate date ranges based on selected time range
  const dateRanges = useMemo(() => {
    const now = Date.now();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    return {
      today: {
        start: today.getTime(),
        end: now
      },
      twoWeeks: {
        start: now - 14 * 24 * 60 * 60 * 1000,
        end: now
      },
      month: {
        start: now - 30 * 24 * 60 * 60 * 1000,
        end: now
      }
    };
  }, []);
  
  // Get stats from Convex backend
  const userStats = useQuery(api.workSessions.getTimeStatsByUser, {
    startDate: dateRanges[timeRange].start,
    endDate: dateRanges[timeRange].end
  });
  
  const teamStats = useQuery(api.workSessions.getTimeStatsByTeam, {
    startDate: dateRanges[timeRange].start,
    endDate: dateRanges[timeRange].end
  });
  
  // Calculate totals for team stats
  const totalTeamTime = useMemo(() => {
    if (!teamStats) return 0;
    return teamStats.reduce((sum, stat) => sum + stat.totalDuration, 0);
  }, [teamStats]);
  
  // Loading states
  if (!isSignedIn) {
    return <div className="p-8 text-center">Please sign in to view analytics</div>;
  }
  
  if (userStats === undefined || teamStats === undefined) {
    return <div className="p-8 text-center">Loading statistics...</div>;
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Time Tracking Analysis</h2>
      <p className="text-muted-foreground">
        Analyze work session data across different time periods
      </p>
      
      <Tabs 
        defaultValue="today"
        value={timeRange}
        onValueChange={(value) => setTimeRange(value as 'today' | 'twoWeeks' | 'month')}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="twoWeeks">Last 2 Weeks</TabsTrigger>
          <TabsTrigger value="month">Last Month</TabsTrigger>
        </TabsList>
        
        {/* Tab content is the same for all tabs, just filtered by date range */}
        <TabsContent value={timeRange} className="space-y-6">
          {/* User's personal stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Work Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userStats.length === 0 ? (
                  <p className="text-muted-foreground">No work sessions recorded in this period</p>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="text-2xl font-bold">
                          {formatTime(userStats.reduce((sum, stat) => sum + stat.totalDuration, 0))}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          Total time tracked
                        </span>
                      </div>
                    </div>
                    
                    {/* Daily breakdown */}
                    <div className="space-y-3 mt-4">
                      <h4 className="text-sm font-medium">Daily Breakdown</h4>
                      {userStats.map((stat, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm">{new Date(stat.date).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(stat.date), { addSuffix: true })}
                            </div>
                          </div>
                          <div className="ml-4 text-sm tabular-nums">
                            {formatTime(stat.totalDuration)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Team stats */}
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {teamStats.length === 0 ? (
                <p className="text-muted-foreground">No team data available for this period</p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <span className="text-2xl font-bold">
                      {formatTime(totalTeamTime)}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      Total team time
                    </span>
                  </div>
                  
                  {/* Team member breakdown with progress bars */}
                  {teamStats.map((member, idx) => {
                    const percentage = Math.round((member.totalDuration / totalTeamTime) * 100) || 0;
                    
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span>Team Member {idx + 1}</span>
                          <span className="font-medium tabular-nums">{formatTime(member.totalDuration)}</span>
                        </div>
                        <div className="relative w-full h-2 bg-muted overflow-hidden rounded-full">
                          <div
                            className="absolute top-0 left-0 h-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{percentage}% of total</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
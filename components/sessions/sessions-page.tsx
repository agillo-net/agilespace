"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

import { ActiveSessionCard } from "./active-session-card";
import { SessionHistory } from "./session-history";
import { Session, Label } from "./types";

export default function SessionsPage() {
  const params = useParams();
  const supabase = createClient();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [completedSessions, setCompletedSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [allLabels, setAllLabels] = useState<Label[]>([]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      // Get current organization ID
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("id")
        .eq("name", params.orgName)
        .single();

      if (orgsError || !orgs)
        throw orgsError || new Error("Organization not found");

      // Get current user's sessions in this organization
      const { data: userSessions, error: sessionsError } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("organization_id", orgs.id)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .order("created_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      // Split into active/paused and completed sessions
      const active =
        userSessions.find(
          (s) => s.status === "active" || s.status === "paused"
        ) || null;
      const completed = userSessions.filter((s) => s.status === "completed");

      setActiveSession(active);
      setCompletedSessions(completed);

      // Load all available labels
      const { data: labels, error: labelsError } = await supabase
        .from("labels")
        .select("*");

      if (!labelsError && labels) {
        setAllLabels(labels);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [supabase, params.orgName]);

  useEffect(() => {
    loadSessions();

    // Set up a poll interval to refresh the active session timer
    const pollInterval = setInterval(() => {
      if (activeSession) {
        loadSessions();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(pollInterval);
  }, [loadSessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Work Sessions</h1>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active Session
            {activeSession && (
              <Badge variant="secondary" className="ml-2">
                1
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            History
            {completedSessions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {completedSessions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          <ActiveSessionCard
            session={activeSession}
            allLabels={allLabels}
            onSessionUpdated={loadSessions}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <SessionHistory sessions={completedSessions} allLabels={allLabels} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

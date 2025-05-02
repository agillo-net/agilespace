"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Loader2 } from "lucide-react";

import { SessionHistory } from "./session-history";
import { Session, Label } from "./types";

export default function SessionsPage() {
  const params = useParams();
  const supabase = createClient();
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

      // Get current user's completed sessions in this organization
      const { data: userSessions, error: sessionsError } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("organization_id", orgs.id)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      setCompletedSessions(userSessions || []);

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
        <h1 className="text-2xl font-bold tracking-tight">Session History</h1>
      </div>

      <SessionHistory sessions={completedSessions} allLabels={allLabels} />
    </div>
  );
}

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ActiveSessionPanel } from "@/components/sessions/active-session-panel";
import { Session, Label } from "@/components/sessions/types";
import { Loader2 } from "lucide-react";

export function SidePanel({ orgName }: { orgName: string }) {
  const supabase = createClient();

  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessionData = async () => {
    try {
      console.log("Fetching active session...");
      // Get current organization ID
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("id")
        .eq("name", orgName)
        .single();

      console.log(orgs);

      if (orgsError || !orgs)
        throw orgsError || new Error("Organization not found");

      // Get current user's sessions in this organization
      const { data: userSessions, error: sessionsError } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("organization_id", orgs.id)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .or("status.eq.active,status.eq.paused");

      if (sessionsError) throw sessionsError;

      console.log(userSessions);
      
      // Get all available labels
      const { data: labels, error: labelsError } = await supabase
        .from("labels")
        .select("*");

      if (labelsError) throw labelsError;
      
      setAllLabels(labels || []);
      setActiveSession(userSessions[0] || null);
      setLoading(false);
    } catch (error) {
      console.error("Error loading session data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionData();
    
    // Set up a poll interval to refresh the active session data
    const pollInterval = setInterval(() => {
      loadSessionData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(pollInterval);
  }, [orgName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <ActiveSessionPanel 
        session={activeSession} 
        allLabels={allLabels}
        onSessionUpdated={loadSessionData}
        orgName={orgName}
      />
    </div>
  );
}

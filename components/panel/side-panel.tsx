import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ActiveSessionPanel } from "@/components/sessions/active-session-panel";
import { Session, Label } from "@/components/sessions/types";
import { Loader2 } from "lucide-react";

interface SessionParticipant {
  username: string;
  avatarUrl: string;
  displayName: string;
}

export function SidePanel({ orgName }: { orgName: string }) {
  const supabase = createClient();

  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [sessionParticipants, setSessionParticipants] = useState<SessionParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessionData = async () => {
    try {
      // Get current organization ID
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("id")
        .eq("name", orgName)
        .single();

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
      
      // Get all available labels
      const { data: labels, error: labelsError } = await supabase
        .from("labels")
        .select("*");

      if (labelsError) throw labelsError;
      
      setAllLabels(labels || []);
      setActiveSession(userSessions[0] || null);
      
      // If we have an active session, fetch its participants
      if (userSessions && userSessions.length > 0) {
        const sessionId = userSessions[0].id;
        
        // Get session participants using a separate query to join with profiles
        // This is an alternative approach that doesn't rely on foreign key relationships
        const { data: participants, error: participantsError } = await supabase
          .from("session_participants")
          .select("user_id")
          .eq("session_id", sessionId);
        
        if (participantsError) throw participantsError;
        
        if (participants && participants.length > 0) {
          // Now fetch the profile information for these users
          const userIds = participants.map(p => p.user_id);
          
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url, github_username")
            .in("id", userIds);
            
          if (profilesError) throw profilesError;
          
          // Transform the data to match the expected format
          const formattedParticipants = profilesData?.map(profile => ({
            username: profile.github_username || "",
            displayName: profile.display_name || "",
            avatarUrl: profile.avatar_url || "/placeholder.svg"
          })) || [];
          
          setSessionParticipants(formattedParticipants);
        } else {
          setSessionParticipants([]);
        }
      } else {
        setSessionParticipants([]);
      }
      
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
        participants={sessionParticipants}
        onSessionUpdated={loadSessionData}
        orgName={orgName}
      />
    </div>
  );
}

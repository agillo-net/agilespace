import { useQuery } from "@tanstack/react-query";
import { useSpaceDashboard } from "./api/use-space-dashboard";
import { getSupabaseClient } from "@/lib/supabase/client";

const supabase = getSupabaseClient();

// Team Collaboration Interfaces
export interface TeamCollaboration {
  totalMembers: number;
  activeMembers: number;
  collaborationScore: number;
  sharedSessions: number;
  crossTrackCollaboration: number;
}

export interface MemberActivity {
  userId: string;
  name: string;
  avatar?: string;
  totalHours: number;
  sessionsCount: number;
  lastActive: Date;
  activityLevel: 'high' | 'medium' | 'low';
  preferredTracks: string[];
}

export interface TeamDynamics {
  peakCollaborationHours: { hour: number; sessions: number }[];
  teamSyncScore: number;
  communicationFrequency: number;
  knowledgeSharing: number;
}

export interface SkillDistribution {
  trackExpertise: { track: string; experts: number; novices: number }[];
  skillGaps: string[];
  mentorshipOpportunities: { mentor: string; mentee: string; track: string }[];
}

export interface TeamPerformance {
  averageSessionDuration: number;
  teamProductivity: number;
  goalCompletion: number;
  improvementAreas: string[];
  strengths: string[];
}

export function useTeamInsights(slug: string) {
  const dashboardData = useSpaceDashboard(slug);

  // Team Collaboration Query
  const teamCollaborationQuery = useQuery({
    queryKey: ['team-collaboration', dashboardData?.spaceData?.space?.id],
    queryFn: async (): Promise<TeamCollaboration> => {
      if (!dashboardData?.spaceData?.space?.id) {
        throw new Error('Space ID not available');
      }

      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          *,
          space_member:space_members(*),
          track:tracks(*)
        `)
        .eq('space_id', dashboardData.spaceData.space.id)
        .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: spaceMembers } = await supabase
        .from('space_members')
        .select('*')
        .eq('space_id', dashboardData.spaceData.space.id);

      const totalMembers = spaceMembers?.length || 0;
      const activeMembers = new Set(sessions?.map((s: { space_member?: { user_id: string }[] }) => s.space_member?.[0]?.user_id)).size;
      
      // Calculate collaboration metrics
      const trackGroups = sessions?.reduce((acc: Record<string, Set<string>>, session: { track?: { id: string }[]; space_member?: { user_id: string }[] }) => {
        const trackId = session.track?.[0]?.id;
        const userId = session.space_member?.[0]?.user_id;
        if (trackId && userId) {
          if (!acc[trackId]) acc[trackId] = new Set();
          acc[trackId].add(userId);
        }
        return acc;
      }, {}) || {};

      const trackGroupValues = Object.values(trackGroups) as Set<string>[];
      const crossTrackCollaboration = trackGroupValues
        .filter((users: Set<string>) => users.size > 1).length;

      return {
        totalMembers,
        activeMembers,
        collaborationScore: totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0,
        sharedSessions: trackGroupValues.reduce((sum: number, users: Set<string>) => sum + Math.max(0, users.size - 1), 0),
        crossTrackCollaboration
      };
    },
    enabled: !!dashboardData?.spaceData?.space?.id,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Member Activity Query
  const memberActivityQuery = useQuery({
    queryKey: ['member-activity', dashboardData?.spaceData?.space?.id],
    queryFn: async (): Promise<MemberActivity[]> => {
      if (!dashboardData?.spaceData?.space?.id) {
        throw new Error('Space ID not available');
      }

      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          *,
          space_member:space_members(*, profile:profiles(*)),
          track:tracks(*)
        `)
        .eq('space_id', dashboardData.spaceData.space.id)
        .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const memberStats = sessions?.reduce((acc: Record<string, {
        userId: string;
        name: string;
        avatar?: string;
        totalHours: number;
        sessionsCount: number;
        lastActive: Date;
        tracks: Set<string>;
      }>, session) => {
        const userId = session.space_member?.[0]?.user_id;
        const profile = session.space_member?.[0]?.profile;
        const trackName = session.track?.[0]?.name;
        
        if (userId && profile) {
          if (!acc[userId]) {
            acc[userId] = {
              userId,
              name: profile.full_name || 'Unknown',
              avatar: profile.avatar_url,
              totalHours: 0,
              sessionsCount: 0,
              lastActive: new Date(session.start_time),
              tracks: new Set()
            };
          }
          
          acc[userId].totalHours += session.duration || 0;
          acc[userId].sessionsCount += 1;
          acc[userId].lastActive = new Date(Math.max(
            acc[userId].lastActive.getTime(),
            new Date(session.start_time).getTime()
          ));
          
          if (trackName) {
            acc[userId].tracks.add(trackName);
          }
        }
        
        return acc;
      }, {}) || {};

      return Object.values(memberStats).map(member => ({
        ...member,
        totalHours: Math.round(member.totalHours / 3600), // Convert to hours
        activityLevel: member.totalHours > 40 ? 'high' : member.totalHours > 20 ? 'medium' : 'low' as const,
        preferredTracks: Array.from(member.tracks)
      }));
    },
    enabled: !!dashboardData?.spaceData?.space?.id,
    refetchInterval: 5 * 60 * 1000,
  });

  // Team Dynamics Query
  const teamDynamicsQuery = useQuery({
    queryKey: ['team-dynamics', dashboardData?.spaceData?.space?.id],
    queryFn: async (): Promise<TeamDynamics> => {
      if (!dashboardData?.spaceData?.space?.id) {
        throw new Error('Space ID not available');
      }

      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('space_id', dashboardData.spaceData.space.id)
        .gte('start_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate peak collaboration hours
      const hourlyActivity = sessions?.reduce((acc: Record<number, number>, session) => {
        const hour = new Date(session.start_time).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {}) || {};

      const peakCollaborationHours = Object.entries(hourlyActivity)
        .map(([hour, sessions]) => ({ hour: parseInt(hour), sessions }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5);

      // Calculate team sync score (sessions overlapping in time)
      const overlappingSessions = sessions?.filter(session => {
        const sessionStart = new Date(session.start_time);
        const sessionEnd = new Date(sessionStart.getTime() + (session.duration || 0) * 1000);
        
        return sessions.some(otherSession => {
          if (otherSession.id === session.id) return false;
          const otherStart = new Date(otherSession.start_time);
          const otherEnd = new Date(otherStart.getTime() + (otherSession.duration || 0) * 1000);
          
          return sessionStart < otherEnd && sessionEnd > otherStart;
        });
      }).length || 0;

      const teamSyncScore = sessions?.length ? (overlappingSessions / sessions.length) * 100 : 0;

      return {
        peakCollaborationHours,
        teamSyncScore,
        communicationFrequency: Math.random() * 100, // Placeholder - would need chat/comment data
        knowledgeSharing: Math.random() * 100 // Placeholder - would need knowledge base data
      };
    },
    enabled: !!dashboardData?.spaceData?.space?.id,
    refetchInterval: 10 * 60 * 1000,
  });

  // Skill Distribution Query
  const skillDistributionQuery = useQuery({
    queryKey: ['skill-distribution', dashboardData?.spaceData?.space?.id],
    queryFn: async (): Promise<SkillDistribution> => {
      if (!dashboardData?.spaceData?.space?.id) {
        throw new Error('Space ID not available');
      }

      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          *,
          space_member:space_members(*, profile:profiles(*)),
          track:tracks(*)
        `)
        .eq('space_id', dashboardData.spaceData.space.id)
        .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Group sessions by track and calculate expertise levels
      const trackExpertise = sessions?.reduce((acc: Record<string, { experts: Set<string>; novices: Set<string> }>, session) => {
        const trackName = session.track?.[0]?.name;
        const userId = session.space_member?.[0]?.user_id;
        const sessionHours = (session.duration || 0) / 3600;
        
        if (trackName && userId) {
          if (!acc[trackName]) {
            acc[trackName] = { experts: new Set(), novices: new Set() };
          }
          
          // Consider expert if > 20 hours in track, novice if < 5 hours
          if (sessionHours > 20) {
            acc[trackName].experts.add(userId);
          } else if (sessionHours < 5) {
            acc[trackName].novices.add(userId);
          }
        }
        
        return acc;
      }, {}) || {};

      const trackExpertiseArray = Object.entries(trackExpertise).map(([track, data]) => ({
        track,
        experts: data.experts.size,
        novices: data.novices.size
      }));

      // Identify skill gaps (tracks with many novices, few experts)
      const skillGaps = trackExpertiseArray
        .filter(track => track.novices > track.experts && track.experts < 2)
        .map(track => track.track);

      // Generate mentorship opportunities
      const mentorshipOpportunities = trackExpertiseArray
        .filter(track => track.experts > 0 && track.novices > 0)
        .slice(0, 5)
        .map(track => ({
          mentor: `Expert in ${track.track}`,
          mentee: `Novice in ${track.track}`,
          track: track.track
        }));

      return {
        trackExpertise: trackExpertiseArray,
        skillGaps,
        mentorshipOpportunities
      };
    },
    enabled: !!dashboardData?.spaceData?.space?.id,
    refetchInterval: 15 * 60 * 1000,
  });

  // Team Performance Query
  const teamPerformanceQuery = useQuery({
    queryKey: ['team-performance', dashboardData?.spaceData?.space?.id],
    queryFn: async (): Promise<TeamPerformance> => {
      if (!dashboardData?.spaceData?.space?.id) {
        throw new Error('Space ID not available');
      }

      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('space_id', dashboardData.spaceData.space.id)
        .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const totalDuration = sessions?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0;
      const averageSessionDuration = sessions?.length ? totalDuration / sessions.length / 3600 : 0;

      // Calculate team productivity (sessions per day)
      const daysInPeriod = 30;
      const teamProductivity = sessions?.length ? sessions.length / daysInPeriod : 0;

      // Analyze performance patterns
      const shortSessions = sessions?.filter(s => (s.duration || 0) < 1800).length || 0; // < 30 min
      const longSessions = sessions?.filter(s => (s.duration || 0) > 7200).length || 0; // > 2 hours

      const improvementAreas: string[] = [];
      const strengths: string[] = [];

      if (shortSessions > (sessions?.length || 0) * 0.3) {
        improvementAreas.push('Session Duration - Many short sessions detected');
      }
      if (longSessions > (sessions?.length || 0) * 0.2) {
        strengths.push('Deep Work - Good focus session lengths');
      }
      if (teamProductivity > 2) {
        strengths.push('High Activity - Consistent daily engagement');
      } else if (teamProductivity < 0.5) {
        improvementAreas.push('Low Activity - Increase daily engagement');
      }

      return {
        averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
        teamProductivity: Math.round(teamProductivity * 100) / 100,
        goalCompletion: Math.random() * 100, // Placeholder - would need goal tracking
        improvementAreas,
        strengths
      };
    },
    enabled: !!dashboardData?.spaceData?.space?.id,
    refetchInterval: 15 * 60 * 1000,
  });

  return {
    teamCollaboration: teamCollaborationQuery.data,
    memberActivity: memberActivityQuery.data,
    teamDynamics: teamDynamicsQuery.data,
    skillDistribution: skillDistributionQuery.data,
    teamPerformance: teamPerformanceQuery.data,
    isLoading: teamCollaborationQuery.isLoading || 
               memberActivityQuery.isLoading || 
               teamDynamicsQuery.isLoading || 
               skillDistributionQuery.isLoading || 
               teamPerformanceQuery.isLoading,
    error: teamCollaborationQuery.error || 
           memberActivityQuery.error || 
           teamDynamicsQuery.error || 
           skillDistributionQuery.error || 
           teamPerformanceQuery.error
  };
}
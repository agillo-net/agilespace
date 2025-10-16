import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useSpaceDashboard } from './api/use-space-dashboard';
import { getDay } from 'date-fns';

interface TimeHeatmapData {
  hour: number;
  day: number;
  sessions: number;
  totalDuration: number;
}

interface ProductivityTrendData {
  date: string;
  sessions: number;
  totalDuration: number;
  focusTime: number;
  completionRate: number;
  activeMembers: number;
}

interface ActivityTimelineEvent {
  id: string;
  type: 'session_start' | 'session_end' | 'member_join' | 'status_change';
  timestamp: string;
  user: {
    name: string;
    avatar: string;
  };
  description: string;
  metadata?: Record<string, unknown>;
}

interface FocusTimeDistribution {
  category: string;
  value: number;
  color: string;
}

export function useEnhancedDashboard(spaceSlug: string) {
  const dashboardData = useSpaceDashboard(spaceSlug);

  // Time Heatmap Query - Shows activity patterns by hour and day
  const timeHeatmapQuery = useQuery({
    queryKey: ['timeHeatmap', dashboardData?.spaceData?.space?.id],
    queryFn: async (): Promise<TimeHeatmapData[]> => {
      if (!dashboardData?.spaceData?.space?.id) return [];
      
      const supabase = getSupabaseClient();
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          id,
          started_at,
          ended_at,
          track:tracks!inner(
            space_id
          )
        `)
        .eq('tracks.space_id', dashboardData.spaceData?.space?.id)
         .not('ended_at', 'is', null);

       if (error) throw error;

       const heatmapData: Record<string, TimeHeatmapData> = {};

       sessions?.forEach((session) => {
         const startTime = new Date(session.started_at);
         const endTime = session.ended_at ? new Date(session.ended_at) : new Date();
         const hour = startTime.getHours();
         // Convert getDay() (0=Sunday, 1=Monday) to component format (0=Monday, 6=Sunday)
         const dayOfWeek = getDay(startTime);
         const day = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
         const key = `${day}-${hour}`;
         
         if (!heatmapData[key]) {
           heatmapData[key] = {
             hour,
             day,
             sessions: 0,
             totalDuration: 0,
           };
         }
         
         heatmapData[key].sessions += 1;
         // Convert milliseconds to minutes for consistent duration handling
         heatmapData[key].totalDuration += (endTime.getTime() - startTime.getTime()) / (1000 * 60);
       });

       return Object.values(heatmapData);
     },
     enabled: !!dashboardData?.spaceData?.space?.id,
   });

   // Productivity Trend Query - Shows productivity metrics over time
   const productivityTrendQuery = useQuery({
     queryKey: ['productivityTrend', dashboardData?.spaceData?.space?.id],
     queryFn: async (): Promise<ProductivityTrendData[]> => {
       if (!dashboardData?.spaceData?.space?.id) return [];
       
       const supabase = getSupabaseClient();
       const { data: sessions, error } = await supabase
         .from('sessions')
         .select(`
           id,
           started_at,
           ended_at,
           space_member_id,
           track:tracks!inner(
             space_id
           )
         `)
         .eq('tracks.space_id', dashboardData.spaceData?.space?.id)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: true });

      if (error) throw error;

      const trendData: Record<string, ProductivityTrendData> = {};
      const membersByDate: Record<string, Set<string>> = {};

      sessions?.forEach((session) => {
        const startTime = new Date(session.started_at);
        const endTime = session.ended_at ? new Date(session.ended_at) : new Date();
        const dateKey = startTime.toISOString().split('T')[0];
        
        if (!trendData[dateKey]) {
          trendData[dateKey] = {
            date: dateKey,
            sessions: 0,
            totalDuration: 0,
            focusTime: 0,
            completionRate: 0,
            activeMembers: 0,
          };
        }

        if (!membersByDate[dateKey]) {
          membersByDate[dateKey] = new Set();
        }
        
        if (session.space_member_id) {
          membersByDate[dateKey].add(session.space_member_id);
        }
        
        trendData[dateKey].sessions += 1;
        const duration = endTime.getTime() - startTime.getTime();
        trendData[dateKey].totalDuration += duration;
        
        // Calculate focus time (sessions longer than 25 minutes)
        if (duration > 25 * 60 * 1000) {
          trendData[dateKey].focusTime += duration;
        }
      });

      // Calculate focus rate (percentage of time spent in focused sessions) and active members for each day
      Object.entries(trendData).forEach(([dateKey, day]) => {
        // This is actually focus rate, not completion rate - should be renamed in interface
        day.completionRate = day.totalDuration > 0 ? Math.round((day.focusTime / day.totalDuration) * 100) : 0;
        day.activeMembers = membersByDate[dateKey]?.size || 0;
      });

      return Object.values(trendData).sort((a, b) => a.date.localeCompare(b.date));
     },
     enabled: !!dashboardData?.spaceData?.space?.id,
   });

   // Activity Timeline Query - Shows recent team activities
   const activityTimelineQuery = useQuery({
     queryKey: ['activityTimeline', dashboardData?.spaceData?.space?.id],
     queryFn: async (): Promise<ActivityTimelineEvent[]> => {
       if (!dashboardData?.spaceData?.space?.id) return [];
       
       const supabase = getSupabaseClient();
       const { data: sessions, error } = await supabase
         .from('sessions')
         .select(`
           id,
           started_at,
           ended_at,
           space_member:space_members!inner(
             id,
             user_id
           ),
           track:tracks!inner(
             title,
             space_id
           )
         `)
         .eq('tracks.space_id', dashboardData.spaceData?.space?.id)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get unique user IDs
        const userIds = [...new Set(
          sessions?.map((session: { space_member: { user_id: string }[] }) => 
            session.space_member?.[0]?.user_id
          ).filter(Boolean)
        )];

        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(
          profiles?.map(profile => [profile.id, profile]) || []
        );

        const events: ActivityTimelineEvent[] = [];

        sessions?.forEach((session: { 
          id: string; 
          started_at: string; 
          ended_at?: string; 
          space_member: { user_id: string }[]; 
          track: { title: string }[] 
        }) => {
          const profile = session.space_member?.[0]?.user_id 
            ? profileMap.get(session.space_member[0].user_id) 
            : null;
          const track = session.track?.[0];
         
         // Session start event
         events.push({
           id: `${session.id}-start`,
           type: 'session_start',
           timestamp: session.started_at,
           user: {
             name: profile?.full_name || 'Unknown User',
             avatar: profile?.avatar_url || '',
           },
           description: `Started working on ${track?.title || 'Untitled Track'}`,
         });

         // Session end event (if ended)
         if (session.ended_at) {
           events.push({
             id: `${session.id}-end`,
             type: 'session_end',
             timestamp: session.ended_at,
             user: {
               name: profile?.full_name || 'Unknown User',
               avatar: profile?.avatar_url || '',
             },
             description: `Completed work on ${track?.title || 'Untitled Track'}`,
           });
         }
       });

       return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
     },
     enabled: !!dashboardData?.spaceData?.space?.id,
   });

   // Focus Time Distribution Query - Shows how focus time is distributed
   const focusTimeDistributionQuery = useQuery({
     queryKey: ['focusTimeDistribution', dashboardData?.spaceData?.space?.id],
     queryFn: async (): Promise<FocusTimeDistribution[]> => {
       if (!dashboardData?.spaceData?.space?.id) return [];
       
       const supabase = getSupabaseClient();
       const { data: sessions, error } = await supabase
         .from('sessions')
         .select(`
           id,
           started_at,
           ended_at,
           track:tracks!inner(
             space_id
           )
         `)
         .eq('tracks.space_id', dashboardData.spaceData?.space?.id)
        .not('ended_at', 'is', null);

      if (error) throw error;

      // Get session tags
      const sessionIds = sessions?.map(s => s.id) || [];
      const { data: sessionTags } = await supabase
        .from('session_tags')
        .select(`
          session_id,
          tag:tags(
            name,
            color
          )
        `)
        .in('session_id', sessionIds);

      const tagMap = new Map();
      sessionTags?.forEach(st => {
        if (!tagMap.has(st.session_id)) {
          tagMap.set(st.session_id, []);
        }
        tagMap.get(st.session_id).push(st.tag);
      });

      const distribution: Record<string, { value: number; color: string }> = {};

      sessions?.forEach((session) => {
        const startTime = new Date(session.started_at);
        const endTime = session.ended_at ? new Date(session.ended_at) : new Date();
        const duration = endTime.getTime() - startTime.getTime();

        const tags = tagMap.get(session.id) || [];

        if (tags.length > 0) {
          tags.forEach((tag: { name: string; color?: string }) => {
            if (tag) {
              if (!distribution[tag.name]) {
                distribution[tag.name] = {
                  value: 0,
                  color: tag.color || '#8884d8',
                };
              }
              distribution[tag.name].value += duration;
            }
          });
        } else {
          // Untagged sessions
          if (!distribution['Untagged']) {
            distribution['Untagged'] = {
              value: 0,
              color: '#82ca9d',
            };
          }
          distribution['Untagged'].value += duration;
        }
      });

      return Object.entries(distribution).map(([category, data]) => ({
        category,
        value: data.value,
        color: data.color,
      }));
    },
    enabled: !!dashboardData?.spaceData?.space?.id,
  });

  return {
    // Original dashboard data
    ...dashboardData,
    
    // Enhanced analytics
    timeHeatmapData: timeHeatmapQuery.data || [],
    isLoadingTimeHeatmap: timeHeatmapQuery.isLoading,
    
    productivityTrendData: productivityTrendQuery.data || [],
    isLoadingProductivityTrend: productivityTrendQuery.isLoading,
    
    activityTimelineData: activityTimelineQuery.data || [],
    isLoadingActivityTimeline: activityTimelineQuery.isLoading,
    
    focusTimeDistributionData: focusTimeDistributionQuery.data || [],
    isLoadingFocusTimeDistribution: focusTimeDistributionQuery.isLoading,
    
    // Loading states
    isLoadingEnhancedData: 
      timeHeatmapQuery.isLoading || 
      productivityTrendQuery.isLoading || 
      activityTimelineQuery.isLoading || 
      focusTimeDistributionQuery.isLoading,
  };
}
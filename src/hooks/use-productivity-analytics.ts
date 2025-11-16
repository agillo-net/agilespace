import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useSpaceDashboard } from './api/use-space-dashboard';
import { queryKeys } from '@/lib/query-keys';

// Types for productivity analytics
export interface ProductivityMetrics {
  totalFocusTime: number;
  averageSessionDuration: number;
  productivityScore: number;
  streakDays: number;
  peakHours: number[];
  weeklyTrend: number;
}

export interface ProductivityComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export interface TeamProductivityInsights {
  topPerformers: {
    userId: string;
    name: string;
    score: number;
    focusTime: number;
  }[];
  teamAverage: number;
  distributionByRole: {
    role: string;
    averageScore: number;
    memberCount: number;
  }[];
}

export interface ProductivityTrends {
  daily: {
    date: string;
    score: number;
    focusTime: number;
    sessions: number;
  }[];
  weekly: {
    week: string;
    score: number;
    focusTime: number;
    sessions: number;
  }[];
  monthly: {
    month: string;
    score: number;
    focusTime: number;
    sessions: number;
  }[];
}

export interface BurnoutIndicators {
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    overtimeHours: number;
    sessionFrequency: number;
    workLifeBalance: number;
    stressIndicators: string[];
  };
  recommendations: string[];
}

export function useProductivityAnalytics(slug: string) {
  const dashboardData = useSpaceDashboard(slug);

  // Individual Productivity Metrics Query
  const productivityMetricsQuery = useQuery({
    queryKey: queryKeys.analytics.productivityMetrics(dashboardData?.spaceData?.space?.id || ''),
    queryFn: async (): Promise<ProductivityMetrics> => {
      if (!dashboardData?.spaceData?.space?.id) {
        return {
          totalFocusTime: 0,
          averageSessionDuration: 0,
          productivityScore: 0,
          streakDays: 0,
          peakHours: [],
          weeklyTrend: 0,
        };
      }

      const supabase = getSupabaseClient();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch sessions for the last 30 days
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
        .gte('started_at', thirtyDaysAgo.toISOString())
        .not('ended_at', 'is', null)
        .limit(100000);

      if (error) throw error;

      // Calculate metrics
      const completedSessions = sessions?.filter(s => s.ended_at) || [];
      const totalFocusTime = completedSessions.reduce((total, session) => {
        const duration = new Date(session.ended_at!).getTime() - new Date(session.started_at).getTime();
        return total + duration / (1000 * 60 * 60); // Convert to hours
      }, 0);

      const averageSessionDuration = completedSessions.length > 0 
        ? totalFocusTime / completedSessions.length 
        : 0;

      // Calculate productivity score (0-100)
      const productivityScore = Math.min(100, Math.round(
        (totalFocusTime * 0.4) + 
        (averageSessionDuration * 10) + 
        (completedSessions.length * 2)
      ));

      // Calculate streak days
      const sessionDates = [...new Set(
        completedSessions.map(s => new Date(s.started_at).toDateString())
      )].sort();
      
      let streakDays = 0;
      const currentDate = new Date();
      
      for (let i = 0; i < 30; i++) {
        const dateStr = currentDate.toDateString();
        if (sessionDates.includes(dateStr)) {
          streakDays++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Find peak hours
      const hourlyActivity = new Array(24).fill(0);
      completedSessions.forEach(session => {
        const hour = new Date(session.started_at).getHours();
        hourlyActivity[hour]++;
      });

      const maxActivity = Math.max(...hourlyActivity);
      const peakHours = hourlyActivity
        .map((activity, hour) => ({ hour, activity }))
        .filter(({ activity }) => activity >= maxActivity * 0.8)
        .map(({ hour }) => hour);

      // Calculate weekly trend
      const lastWeekSessions = completedSessions.filter(s => 
        new Date(s.started_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      );
      const previousWeekSessions = completedSessions.filter(s => {
        const sessionDate = new Date(s.started_at);
        return sessionDate >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
               sessionDate < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      });

      const weeklyTrend = previousWeekSessions.length > 0
        ? ((lastWeekSessions.length - previousWeekSessions.length) / previousWeekSessions.length) * 100
        : 0;

      return {
        totalFocusTime: Math.round(totalFocusTime * 100) / 100,
        averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
        productivityScore,
        streakDays,
        peakHours,
        weeklyTrend: Math.round(weeklyTrend * 100) / 100,
      };
    },
    enabled: !!dashboardData?.spaceData?.space?.id,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Team Productivity Insights Query
  const teamInsightsQuery = useQuery({
    queryKey: queryKeys.analytics.teamProductivityInsights(dashboardData?.spaceData?.space?.id || ''),
    queryFn: async (): Promise<TeamProductivityInsights> => {
      if (!dashboardData?.spaceData?.space?.id) {
        return {
          topPerformers: [],
          teamAverage: 0,
          distributionByRole: [],
        };
      }

      const supabase = getSupabaseClient();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch sessions with user data
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          id,
          started_at,
          ended_at,
          space_member:space_members!inner(
            id,
            user_id,
            role,
            profile:profiles!inner(
              id,
              full_name
            )
          ),
          track:tracks!inner(
            space_id
          )
        `)
        .eq('tracks.space_id', dashboardData.spaceData?.space?.id)
        .gte('started_at', thirtyDaysAgo.toISOString())
        .not('ended_at', 'is', null);

      if (error) throw error;

      // Calculate user productivity scores
      const userMetrics = new Map<string, {
        userId: string;
        name: string;
        role: string;
        totalHours: number;
        sessionCount: number;
      }>();
      
      sessions?.forEach((session: {
        id: string;
        started_at: string;
        ended_at: string;
        space_member: {
          id: string;
          user_id: string;
          role: string;
          profile: { id: string; full_name: string }[];
        }[];
      }) => {
        const spaceMember = session.space_member[0];
        if (!spaceMember) return;

        const userId = spaceMember.user_id;
        const duration = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
        const hours = duration / (1000 * 60 * 60);

        if (!userMetrics.has(userId)) {
          userMetrics.set(userId, {
            userId,
            name: spaceMember.profile?.[0]?.full_name || 'Unknown User',
            role: spaceMember.role,
            totalHours: 0,
            sessionCount: 0,
          });
        }

        const metrics = userMetrics.get(userId);
        if (metrics) {
          metrics.totalHours += hours;
          metrics.sessionCount += 1;
        }
      });

      // Calculate scores and create top performers list
      const performers = Array.from(userMetrics.values()).map(user => ({
        userId: user.userId,
        name: user.name,
        score: Math.min(100, Math.round(
          (user.totalHours * 0.4) + 
          (user.totalHours / user.sessionCount * 10) + 
          (user.sessionCount * 2)
        )),
        focusTime: Math.round(user.totalHours * 100) / 100,
        role: user.role,
      }));

      const topPerformers = performers
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const teamAverage = performers.length > 0
        ? Math.round(performers.reduce((sum, p) => sum + p.score, 0) / performers.length)
        : 0;

      // Distribution by role
      const roleGroups = performers.reduce((groups: Record<string, typeof performers>, performer) => {
        if (!groups[performer.role]) {
          groups[performer.role] = [];
        }
        groups[performer.role].push(performer);
        return groups;
      }, {} as Record<string, typeof performers>);

      const distributionByRole = Object.entries(roleGroups).map(([role, members]) => ({
        role,
        averageScore: Math.round(members.reduce((sum, m) => sum + m.score, 0) / members.length),
        memberCount: members.length,
      }));

      return {
        topPerformers,
        teamAverage,
        distributionByRole,
      };
    },
    enabled: !!dashboardData?.spaceData?.space?.id,
  });

  // Productivity Trends Query
  const trendsQuery = useQuery({
    queryKey: queryKeys.analytics.productivityTrends(dashboardData?.spaceData?.space?.id || ''),
    queryFn: async (): Promise<ProductivityTrends> => {
      if (!dashboardData?.spaceData?.space?.id) {
        return {
          daily: [],
          weekly: [],
          monthly: [],
        };
      }

      const supabase = getSupabaseClient();
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

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
        .gte('started_at', ninetyDaysAgo.toISOString())
        .not('ended_at', 'is', null);

      if (error) throw error;

      // Group by day
      const dailyGroups = sessions?.reduce((groups: Record<string, typeof sessions>, session) => {
        const date = new Date(session.started_at).toISOString().split('T')[0];
        if (!groups[date]) groups[date] = [];
        groups[date].push(session);
        return groups;
      }, {} as Record<string, typeof sessions>) || {};

      const daily = Object.entries(dailyGroups).map(([date, daySessions]) => {
        const focusTime = daySessions.reduce((total, session) => {
          const duration = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
          return total + duration / (1000 * 60 * 60);
        }, 0);

        const score = Math.min(100, Math.round(
          (focusTime * 0.4) + 
          (focusTime / daySessions.length * 10) + 
          (daySessions.length * 2)
        ));

        return {
          date,
          score,
          focusTime: Math.round(focusTime * 100) / 100,
          sessions: daySessions.length,
        };
      }).sort((a, b) => a.date.localeCompare(b.date));

      // Generate weekly and monthly aggregations
      const weekly: {
        week: string;
        score: number;
        focusTime: number;
        sessions: number;
      }[] = [];
      const monthly: {
        month: string;
        score: number;
        focusTime: number;
        sessions: number;
      }[] = [];

      // Group daily data into weeks and months
      const weekGroups: Record<string, typeof daily> = {};
      const monthGroups: Record<string, typeof daily> = {};

      daily.forEach(day => {
        const date = new Date(day.date);
        const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        if (!weekGroups[weekKey]) weekGroups[weekKey] = [];
        if (!monthGroups[monthKey]) monthGroups[monthKey] = [];

        weekGroups[weekKey].push(day);
        monthGroups[monthKey].push(day);
      });

      Object.entries(weekGroups).forEach(([week, days]) => {
        const totalFocusTime = days.reduce((sum, day) => sum + day.focusTime, 0);
        const totalSessions = days.reduce((sum, day) => sum + day.sessions, 0);
        const avgScore = days.reduce((sum, day) => sum + day.score, 0) / days.length;

        weekly.push({
          week,
          score: Math.round(avgScore),
          focusTime: Math.round(totalFocusTime * 100) / 100,
          sessions: totalSessions,
        });
      });

      Object.entries(monthGroups).forEach(([month, days]) => {
        const totalFocusTime = days.reduce((sum, day) => sum + day.focusTime, 0);
        const totalSessions = days.reduce((sum, day) => sum + day.sessions, 0);
        const avgScore = days.reduce((sum, day) => sum + day.score, 0) / days.length;

        monthly.push({
          month,
          score: Math.round(avgScore),
          focusTime: Math.round(totalFocusTime * 100) / 100,
          sessions: totalSessions,
        });
      });

      return {
        daily: daily.slice(-30), // Last 30 days
        weekly: weekly.sort((a, b) => a.week.localeCompare(b.week)),
        monthly: monthly.sort((a, b) => a.month.localeCompare(b.month)),
      };
    },
    enabled: !!dashboardData?.spaceData?.space?.id,
  });

  // Burnout Indicators Query
  const burnoutIndicatorsQuery = useQuery({
    queryKey: queryKeys.analytics.burnoutIndicators(dashboardData?.spaceData?.space?.id || ''),
    queryFn: async (): Promise<BurnoutIndicators> => {
      if (!dashboardData?.spaceData?.space?.id) {
        return {
          riskLevel: 'low',
          factors: {
            overtimeHours: 0,
            sessionFrequency: 0,
            workLifeBalance: 100,
            stressIndicators: [],
          },
          recommendations: [],
        };
      }

      const supabase = getSupabaseClient();
      const now = new Date();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

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
        .gte('started_at', fourteenDaysAgo.toISOString())
        .not('ended_at', 'is', null);

      if (error) throw error;

      const completedSessions = sessions?.filter(s => s.ended_at) || [];

      // Calculate overtime hours (sessions outside 9-17)
      const overtimeHours = completedSessions.reduce((total, session) => {
        const startHour = new Date(session.started_at).getHours();
        const endHour = new Date(session.ended_at!).getHours();
        
        let overtime = 0;
        if (startHour < 9) overtime += (9 - startHour);
        if (endHour > 17) overtime += (endHour - 17);
        
        return total + overtime;
      }, 0);

      // Calculate session frequency (sessions per day)
      const sessionDays = [...new Set(
        completedSessions.map(s => new Date(s.started_at).toDateString())
      )];
      const sessionFrequency = sessionDays.length > 0 ? completedSessions.length / sessionDays.length : 0;

      // Calculate work-life balance score
      const weekendSessions = completedSessions.filter(s => {
        const day = new Date(s.started_at).getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      });
      const workLifeBalance = Math.max(0, 100 - (weekendSessions.length / completedSessions.length * 100));

      // Identify stress indicators
      const stressIndicators: string[] = [];
      if (overtimeHours > 20) stressIndicators.push('Excessive overtime hours');
      if (sessionFrequency > 8) stressIndicators.push('High session frequency');
      if (workLifeBalance < 70) stressIndicators.push('Poor work-life balance');
      if (weekendSessions.length > 5) stressIndicators.push('Frequent weekend work');

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (stressIndicators.length >= 3) riskLevel = 'high';
      else if (stressIndicators.length >= 2) riskLevel = 'medium';

      // Generate recommendations
      const recommendations: string[] = [];
      if (overtimeHours > 10) recommendations.push('Consider reducing overtime hours');
      if (sessionFrequency > 6) recommendations.push('Take regular breaks between sessions');
      if (workLifeBalance < 80) recommendations.push('Maintain better work-life boundaries');
      if (weekendSessions.length > 2) recommendations.push('Limit weekend work sessions');

      return {
        riskLevel,
        factors: {
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          sessionFrequency: Math.round(sessionFrequency * 100) / 100,
          workLifeBalance: Math.round(workLifeBalance),
          stressIndicators,
        },
        recommendations,
      };
    },
    enabled: !!dashboardData?.spaceData?.space?.id,
  });

  return {
    productivityMetrics: productivityMetricsQuery.data,
    teamInsights: teamInsightsQuery.data,
    trends: trendsQuery.data,
    burnoutIndicators: burnoutIndicatorsQuery.data,
    isLoading: productivityMetricsQuery.isLoading || teamInsightsQuery.isLoading || trendsQuery.isLoading || burnoutIndicatorsQuery.isLoading,
    error: productivityMetricsQuery.error || teamInsightsQuery.error || trendsQuery.error || burnoutIndicatorsQuery.error,
  };
}
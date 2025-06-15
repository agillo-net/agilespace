import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import SpaceOverview from "@/pages/space-overview";

export const Route = createFileRoute('/space')({
  component: RouteComponent,
})

function RouteComponent() {
  // Tab state management
  const [activeTab, setActiveTab] = useState<'assignedIssues' | 'codeReviews' | 'yourPRs'>('assignedIssues');

  // Mock data - Replace with actual API calls and state management
  const mockProps = {
    workStatus: {
      status: 'working' as const,
      location: 'office' as const,
      onUpdateStatus: () => {
        console.log('Update work status');
        // TODO: Implement work status update logic
      },
    },
    
    activeSession: {
      isActive: true,
      duration: "04:23:15",
      taskTitle: "Fix authentication flow in login service",
      onStartTimer: () => {
        console.log('Start timer');
        // TODO: Implement timer start logic
      },
      onEndSession: () => {
        console.log('End session');
        // TODO: Implement session end logic
      },
    },
    
    timeTracking: {
      today: {
        worked: "2:45",
        target: "8:00",
        percentage: 34,
      },
      thisMonth: {
        worked: "65:20",
        target: "160:00",
        percentage: 41,
      },
    },
    
    issuesTabs: {
      activeTab,
      onTabChange: (tab: 'assignedIssues' | 'codeReviews' | 'yourPRs') => {
        setActiveTab(tab);
        console.log('Tab changed to:', tab);
        // TODO: Implement tab-specific data fetching if needed
      },
      assignedIssues: {
        count: 2,
        items: [
          {
            id: "1",
            title: "auth-service/login-flow",
            labels: [
              { name: "bug", variant: 'error' as const },
              { name: "security", variant: 'warning' as const },
            ],
            updatedAt: "2h ago",
            url: "https://github.com/example/repo/issues/1",
          },
          {
            id: "2",
            title: "api/rate-limiting",
            labels: [
              { name: "enhancement", variant: 'neutral' as const },
            ],
            updatedAt: "5h ago",
            url: "https://github.com/example/repo/issues/2",
          },
        ],
      },
      codeReviews: {
        count: 2,
        items: [
          {
            id: "3",
            title: "refactor/user-authentication",
            labels: [
              { name: "review", variant: 'warning' as const },
              { name: "high-priority", variant: 'error' as const },
            ],
            updatedAt: "1h ago",
            url: "https://github.com/example/repo/pull/3",
          },
          {
            id: "4",
            title: "feature/dashboard-metrics",
            labels: [
              { name: "feature", variant: 'success' as const },
            ],
            updatedAt: "3h ago",
            url: "https://github.com/example/repo/pull/4",
          },
        ],
      },
      yourPRs: {
        count: 3,
        items: [
          {
            id: "5",
            title: "fix/memory-optimization",
            labels: [
              { name: "performance", variant: 'neutral' as const },
              { name: "bug", variant: 'error' as const },
            ],
            updatedAt: "30m ago",
            url: "https://github.com/example/repo/pull/5",
          },
          {
            id: "6",
            title: "docs/api-endpoints",
            labels: [
              { name: "documentation", variant: 'neutral' as const },
            ],
            updatedAt: "2h ago",
            url: "https://github.com/example/repo/pull/6",
          },
          {
            id: "7",
            title: "feature/real-time-updates",
            labels: [
              { name: "feature", variant: 'success' as const },
              { name: "in-progress", variant: 'warning' as const },
            ],
            updatedAt: "4h ago",
            url: "https://github.com/example/repo/pull/7",
          },
        ],
      },
    },
    
    recentSessions: [
      {
        id: "session-1",
        issueTitle: "Implement OAuth flow",
        duration: "2h 15m",
        date: "Today",
        tags: [
          { name: "auth", variant: 'neutral' as const },
          { name: "api", variant: 'neutral' as const },
        ],
        onViewDetails: (sessionId: string) => {
          console.log('View session details:', sessionId);
          // TODO: Implement session details view
        },
      },
      {
        id: "session-2",
        issueTitle: "Fix memory leak in worker",
        duration: "1h 45m",
        date: "Yesterday",
        tags: [
          { name: "performance", variant: 'neutral' as const },
        ],
        onViewDetails: (sessionId: string) => {
          console.log('View session details:', sessionId);
          // TODO: Implement session details view
        },
      },
    ],
    
    actions: {
      onFilterSessions: () => {
        console.log('Filter sessions');
        // TODO: Implement session filtering
      },
      onOpenIssue: (url: string) => {
        console.log('Open issue:', url);
        window.open(url, '_blank');
      },
    },
    
    isLoading: {
      workStatus: false,
      activeSession: false,
      timeTracking: false,
      issues: false,
      recentSessions: false,
    },
  };

  return <SpaceOverview {...mockProps} />;
}

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Issue = {
  id: number;
  title: string;
  url: string;
  elapsedTime: number;
  isRunning: boolean;
};

interface TimerState {
  // Timer state
  issues: Issue[];
  activeIssueId: number | null;
  isCommentModalOpen: boolean;
  isSwitchingIssues: boolean;

  // Actions
  setActiveIssueId: (id: number | null) => void;
  setIsCommentModalOpen: (isOpen: boolean) => void;
  setIsSwitchingIssues: (isSwitching: boolean) => void;
  startTracking: (issue: Omit<Issue, 'elapsedTime' | 'isRunning'>) => void;
  stopTracking: () => void;
  toggleTimer: () => void;
  cancelComment: () => void;
  discardTracking: () => void;
  submitComment: (comment: string) => Promise<void>;
  switchToIssue: (issueId: number) => void;
  updateIssueTime: (issueId: number, elapsedTime: number) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // Timer state
      issues: [],
      activeIssueId: null,
      isCommentModalOpen: false,
      isSwitchingIssues: false,

      // Actions
      setActiveIssueId: (id) => set({ activeIssueId: id }),
      setIsCommentModalOpen: (isOpen) => set({ isCommentModalOpen: isOpen }),
      setIsSwitchingIssues: (isSwitching) => set({ isSwitchingIssues: isSwitching }),

      startTracking: (issue) => {
        const state = get();
        const existingIssue = state.issues.find(i => i.id === issue.id);

        if (existingIssue) {
          // If issue exists, just switch to it
          set({ activeIssueId: issue.id });
          return;
        }

        // Add new issue
        const newIssue: Issue = {
          ...issue,
          elapsedTime: 0,
          isRunning: true
        };

        set((state) => ({
          issues: [...state.issues, newIssue],
          activeIssueId: issue.id
        }));
      },

      stopTracking: () => {
        const state = get();
        if (!state.activeIssueId) return;

        set((state) => ({
          issues: state.issues.map(issue =>
            issue.id === state.activeIssueId
              ? { ...issue, isRunning: false }
              : issue
          ),
          isCommentModalOpen: true
        }));
      },

      toggleTimer: () => {
        const state = get();
        if (!state.activeIssueId) return;

        set((state) => ({
          issues: state.issues.map(issue =>
            issue.id === state.activeIssueId
              ? { ...issue, isRunning: !issue.isRunning }
              : issue
          )
        }));
      },

      cancelComment: () => {
        const state = get();
        set({ isCommentModalOpen: false });
      },

      discardTracking: () => {
        const state = get();
        if (!state.activeIssueId) return;

        set((state) => ({
          issues: state.issues.filter(issue => issue.id !== state.activeIssueId),
          activeIssueId: state.issues.length > 1 ? state.issues[0].id : null,
          isCommentModalOpen: false
        }));
      },

      switchToIssue: (issueId) => {
        const state = get();
        if (!state.issues.find(i => i.id === issueId)) return;

        // Pause current issue if any
        if (state.activeIssueId) {
          set((state) => ({
            issues: state.issues.map(issue =>
              issue.id === state.activeIssueId
                ? { ...issue, isRunning: false }
                : issue
            )
          }));
        }

        // Switch to new issue
        set((state) => ({
          activeIssueId: issueId,
          issues: state.issues.map(issue =>
            issue.id === issueId
              ? { ...issue, isRunning: true }
              : issue
          )
        }));
      },

      updateIssueTime: (issueId, elapsedTime) => {
        set((state) => ({
          issues: state.issues.map(issue =>
            issue.id === issueId
              ? { ...issue, elapsedTime }
              : issue
          )
        }));
      },

      submitComment: async (comment) => {
        const state = get();
        const activeIssue = state.issues.find(i => i.id === state.activeIssueId);
        if (!activeIssue) return;

        try {
          // Extract owner and repo from URL to format API endpoint
          const urlParts = activeIssue.url.split("/");
          const issueNumber = urlParts[urlParts.length - 1];
          const repo = urlParts[urlParts.length - 3];
          const owner = urlParts[urlParts.length - 4];

          const timeTracked = activeIssue.elapsedTime;

          // Format comment with time tracked information
          const formattedComment = `
### Time Tracked: ${Math.floor(timeTracked / 3600)}h ${Math.floor(
            (timeTracked % 3600) / 60
          )}m ${timeTracked % 60}s

${comment}
          `.trim();

          // Send comment to GitHub API
          await fetch("/api/github/comment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              owner,
              repo,
              issueNumber,
              comment: formattedComment,
            }),
          });

          // Remove the issue after successful submission
          set((state) => ({
            issues: state.issues.filter(issue => issue.id !== state.activeIssueId),
            activeIssueId: state.issues.length > 1 ? state.issues[0].id : null,
            isCommentModalOpen: false
          }));
        } catch (error) {
          console.error("Error submitting comment:", error);
          throw error;
        }
      },
    }),
    {
      name: "agillo-timer-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        issues: state.issues,
        activeIssueId: state.activeIssueId,
      }),
    }
  )
);

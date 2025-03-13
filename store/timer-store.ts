import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ActiveIssue = {
  id: number;
  title: string;
  url: string;
} | null;

interface TimerState {
  // Timer state
  isRunning: boolean;
  elapsedTime: number;
  activeIssue: ActiveIssue;
  nextIssue: ActiveIssue;
  isCommentModalOpen: boolean;
  isSwitchingIssues: boolean;

  // Actions
  setIsRunning: (isRunning: boolean) => void;
  setElapsedTime: (time: number) => void;
  setActiveIssue: (issue: ActiveIssue) => void;
  setNextIssue: (issue: ActiveIssue) => void;
  setIsCommentModalOpen: (isOpen: boolean) => void;
  setIsSwitchingIssues: (isSwitching: boolean) => void;
  startTracking: (issue: ActiveIssue) => void;
  stopTracking: () => void;
  toggleTimer: () => void;
  cancelComment: () => void;
  discardTracking: () => void;
  submitComment: (comment: string) => Promise<void>;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // Timer state
      isRunning: false,
      elapsedTime: 0,
      activeIssue: null,
      nextIssue: null,
      isCommentModalOpen: false,
      isSwitchingIssues: false,

      // Actions
      setIsRunning: (isRunning) => set({ isRunning }),
      setElapsedTime: (elapsedTime) => set({ elapsedTime }),
      setActiveIssue: (activeIssue) => set({ activeIssue }),
      setNextIssue: (nextIssue) => set({ nextIssue }),
      setIsCommentModalOpen: (isCommentModalOpen) =>
        set({ isCommentModalOpen }),
      setIsSwitchingIssues: (isSwitchingIssues) => set({ isSwitchingIssues }),

      startTracking: (issue) => {
        const state = get();
        // If there's already an active issue
        if (state.activeIssue) {
          // Store the next issue we want to switch to
          set({
            nextIssue: issue,
            isRunning: false,
            isSwitchingIssues: true,
            isCommentModalOpen: true,
          });
        } else {
          // Start tracking the new issue directly if no active issue
          set({
            activeIssue: issue,
            isRunning: true,
          });
        }
      },

      stopTracking: () =>
        set({
          isRunning: false,
          isCommentModalOpen: true,
        }),

      toggleTimer: () =>
        set((state) => ({
          isRunning: !state.isRunning,
        })),

      cancelComment: () => {
        const state = get();
        set({ isCommentModalOpen: false });

        // If we were switching issues and canceled, continue tracking the current issue
        if (state.isSwitchingIssues) {
          set({
            isRunning: true,
            nextIssue: null,
            isSwitchingIssues: false,
          });
        } else {
          // Regular cancel - reset everything
          set({ isRunning: true });
        }
      },

      discardTracking: () => {
        const state = get();
        set({ isCommentModalOpen: false });

        // If we're switching issues, start tracking the next issue directly
        if (state.isSwitchingIssues && state.nextIssue) {
          set({
            activeIssue: state.nextIssue,
            nextIssue: null,
            isSwitchingIssues: false,
            elapsedTime: 0,
            isRunning: true,
          });
        } else {
          // Regular discard - reset everything without submitting
          set({
            activeIssue: null,
            elapsedTime: 0,
          });
        }
      },

      submitComment: async (comment) => {
        const state = get();
        if (!state.activeIssue) return;

        try {
          // Extract owner and repo from URL to format API endpoint
          const urlParts = state.activeIssue.url.split("/");
          const issueNumber = urlParts[urlParts.length - 1];
          const repo = urlParts[urlParts.length - 3];
          const owner = urlParts[urlParts.length - 4];

          const timeTracked = state.elapsedTime;

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

          // Reset the timer state after successful submission
          set({ isCommentModalOpen: false });

          // If we're switching issues, start tracking the next issue
          if (state.isSwitchingIssues && state.nextIssue) {
            set({
              activeIssue: state.nextIssue,
              nextIssue: null,
              isSwitchingIssues: false,
              elapsedTime: 0,
              isRunning: true,
            });
          } else {
            // Regular stop tracking flow
            set({
              activeIssue: null,
              elapsedTime: 0,
            });
          }
        } catch (error) {
          console.error("Error submitting comment:", error);
          // Keep the modal open on error
          throw error;
        }
      },
    }),
    {
      name: "agillo-timer-store", // unique name for storage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these specific parts of the state
        isRunning: state.isRunning,
        elapsedTime: state.elapsedTime,
        activeIssue: state.activeIssue,
        // Don't persist UI state like isCommentModalOpen
      }),
    }
  )
);

'use client';

import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

type ActiveIssue = {
  id: number;
  title: string;
  url: string;
} | null;

interface TimerContextType {
  isRunning: boolean;
  elapsedTime: number;
  activeIssue: ActiveIssue;
  nextIssue: ActiveIssue;
  isCommentModalOpen: boolean;
  isSwitchingIssues: boolean;
  startTracking: (issue: ActiveIssue) => void;
  stopTracking: () => void;
  toggleTimer: () => void;
  cancelComment: () => void;
  submitComment: (comment: string) => Promise<void>;
  discardTracking: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeIssue, setActiveIssue] = useState<ActiveIssue>(null);
  const [nextIssue, setNextIssue] = useState<ActiveIssue>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isSwitchingIssues, setIsSwitchingIssues] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTime * 1000;
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedTime(elapsed);
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const startTracking = (issue: ActiveIssue) => {
    // If there's already an active issue
    if (activeIssue) {
      // Store the next issue we want to switch to
      setNextIssue(issue);
      // Stop tracking the current issue and show the comment modal
      setIsRunning(false);
      setIsSwitchingIssues(true);
      setIsCommentModalOpen(true);
    } else {
      // Start tracking the new issue directly if no active issue
      setActiveIssue(issue);
      setIsRunning(true);
    }
  };

  const stopTracking = () => {
    // Stop the timer but keep the issue active for the modal
    setIsRunning(false);
    // Open the comment modal
    setIsCommentModalOpen(true);
  };

  const cancelComment = () => {
    // Close the modal and reset everything
    setIsCommentModalOpen(false);
    
    // If we were switching issues and canceled, continue tracking the current issue
    if (isSwitchingIssues) {
      setIsRunning(true);
      setNextIssue(null);
      setIsSwitchingIssues(false);
    } else {
      // Regular cancel - reset everything
      setIsRunning(true);
    }
  };
  
  const discardTracking = () => {
    // Close the modal and completely reset everything
    setIsCommentModalOpen(false);
    
    // If we're switching issues, start tracking the next issue directly
    if (isSwitchingIssues && nextIssue) {
      setActiveIssue(nextIssue);
      setNextIssue(null);
      setIsSwitchingIssues(false);
      setElapsedTime(0);
      setIsRunning(true);
    } else {
      // Regular discard - reset everything without submitting
      setActiveIssue(null);
      setElapsedTime(0);
    }
  };

  const submitComment = async (comment: string) => {
    if (!activeIssue) return;
    
    try {
      // Extract owner and repo from URL to format API endpoint
      const urlParts = activeIssue.url.split('/');
      const issueNumber = urlParts[urlParts.length - 1];
      const repo = urlParts[urlParts.length - 3];
      const owner = urlParts[urlParts.length - 4];
      
      const timeTracked = elapsedTime;
      
      // Format comment with time tracked information
      const formattedComment = `
### Time Tracked: ${Math.floor(timeTracked / 3600)}h ${Math.floor((timeTracked % 3600) / 60)}m ${timeTracked % 60}s

${comment}
      `.trim();
      
      // Send comment to GitHub API
      await fetch('/api/github/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner,
          repo,
          issueNumber,
          comment: formattedComment,
        }),
      });
      
      // Reset the timer state after successful submission
      setIsCommentModalOpen(false);
      
      // If we're switching issues, start tracking the next issue
      if (isSwitchingIssues && nextIssue) {
        setActiveIssue(nextIssue);
        setNextIssue(null);
        setIsSwitchingIssues(false);
        setElapsedTime(0);
        setIsRunning(true);
      } else {
        // Regular stop tracking flow
        setActiveIssue(null);
        setElapsedTime(0);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      // Keep the modal open on error
      throw error;
    }
  };

  const toggleTimer = () => {
    setIsRunning(prev => !prev);
  };

  return (
    <TimerContext.Provider
      value={{
        isRunning,
        elapsedTime,
        activeIssue,
        nextIssue,
        isCommentModalOpen,
        isSwitchingIssues,
        startTracking,
        stopTracking,
        toggleTimer,
        cancelComment,
        submitComment,
        discardTracking
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useLocalStorage } from './use-local-storage';
import {
  type NotificationSound,
  playNotificationSound,
  requestNotificationPermission,
  showBrowserNotification,
  formatMinutesToDuration,
} from '@/lib/audio-utils';

/**
 * Audio notification settings stored in localStorage
 */
export interface AudioNotificationSettings {
  enabled: boolean;
  intervals: number[]; // Minutes (e.g., [30, 60, 90, 120])
  sound: NotificationSound;
  volume: number; // 0-100
  repeat: boolean; // If true, notifications repeat; if false, play once per interval
  browserNotifications: boolean;
}

/**
 * Default audio notification settings
 */
export const DEFAULT_AUDIO_SETTINGS: AudioNotificationSettings = {
  enabled: true,
  intervals: [60], // Default: notify every 60 minutes
  sound: 'chime',
  volume: 70,
  repeat: true,
  browserNotifications: false,
};

/**
 * Hook to manage audio notifications for active sessions
 * @param startedAt - ISO timestamp when the session started
 * @param isActive - Whether a session is currently active
 * @returns Visual state for UI updates
 */
export function useAudioNotifications(
  startedAt: string | null,
  isActive: boolean
) {
  const [settings] = useLocalStorage<AudioNotificationSettings>(
    'audio-notification-settings',
    DEFAULT_AUDIO_SETTINGS
  );

  const [isNotifying, setIsNotifying] = useState(false);
  const triggeredIntervalsRef = useRef<Set<number>>(new Set());
  const lastElapsedMinutesRef = useRef<number>(0);

  // Reset triggered intervals when session starts or changes
  useEffect(() => {
    if (startedAt) {
      triggeredIntervalsRef.current.clear();
      lastElapsedMinutesRef.current = 0;
    }
  }, [startedAt]);

  useEffect(() => {
    if (!isActive || !startedAt || !settings.enabled) {
      return;
    }

    const checkNotifications = () => {
      const now = Date.now();
      const sessionStart = new Date(startedAt).getTime();
      const elapsed = now - sessionStart;
      const elapsedMinutes = Math.floor(elapsed / (1000 * 60));

      // Only process if minutes have changed
      if (elapsedMinutes === lastElapsedMinutesRef.current) {
        return;
      }

      lastElapsedMinutesRef.current = elapsedMinutes;

      // Check each configured interval
      for (const interval of settings.intervals) {
        const shouldTrigger = elapsedMinutes >= interval && elapsedMinutes > 0;

        if (!shouldTrigger) continue;

        // For repeating notifications, check if we've hit exact multiples
        if (settings.repeat) {
          const isExactInterval = elapsedMinutes % interval === 0;
          const intervalKey = elapsedMinutes; // Unique key for each minute

          if (isExactInterval && !triggeredIntervalsRef.current.has(intervalKey)) {
            triggeredNotification(interval, elapsedMinutes);
            triggeredIntervalsRef.current.add(intervalKey);
          }
        } else {
          // For one-time notifications, only trigger once per interval
          if (!triggeredIntervalsRef.current.has(interval)) {
            triggeredNotification(interval, elapsedMinutes);
            triggeredIntervalsRef.current.add(interval);
          }
        }
      }
    };

    const triggeredNotification = async (
      _interval: number,
      elapsedMinutes: number
    ) => {
      const durationText = formatMinutesToDuration(elapsedMinutes);
      const message = `You've been working for ${durationText}`;

      // Visual feedback
      setIsNotifying(true);
      setTimeout(() => setIsNotifying(false), 3000); // Show for 3 seconds

      // Play audio
      try {
        await playNotificationSound(settings.sound, settings.volume);
      } catch (error) {
        console.warn('Audio playback failed:', error);
      }

      // Show toast notification
      toast.info(message, {
        description: 'Time to take a break?',
        duration: 5000,
      });

      // Browser notification
      if (settings.browserNotifications) {
        if (Notification.permission === 'granted') {
          showBrowserNotification('Session Time Alert', message);
        } else if (Notification.permission === 'default') {
          // Request permission for next time
          requestNotificationPermission();
        }
      }
    };

    // Check every second (piggyback on existing timer logic)
    const intervalId = setInterval(checkNotifications, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, startedAt, settings]);

  return {
    isNotifying, // Can be used to add visual effects (pulsing, color change, etc.)
  };
}

/**
 * Hook for managing audio notification settings
 * Separated for use in settings UI
 */
export function useAudioNotificationSettings() {
  const [settings, setSettings] = useLocalStorage<AudioNotificationSettings>(
    'audio-notification-settings',
    DEFAULT_AUDIO_SETTINGS
  );

  const addInterval = (minutes: number) => {
    if (!settings.intervals.includes(minutes)) {
      setSettings({
        ...settings,
        intervals: [...settings.intervals, minutes].sort((a, b) => a - b),
      });
    }
  };

  const removeInterval = (minutes: number) => {
    setSettings({
      ...settings,
      intervals: settings.intervals.filter((i) => i !== minutes),
    });
  };

  const updateSettings = (partial: Partial<AudioNotificationSettings>) => {
    setSettings({ ...settings, ...partial });
  };

  const testSound = async () => {
    try {
      await playNotificationSound(settings.sound, settings.volume);
      toast.success('Test sound played successfully');
    } catch {
      toast.error('Failed to play sound. Check your browser settings.');
    }
  };

  const requestBrowserPermission = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      toast.success('Browser notifications enabled');
      updateSettings({ browserNotifications: true });
    } else {
      toast.error('Browser notifications permission denied');
      updateSettings({ browserNotifications: false });
    }
  };

  return {
    settings,
    addInterval,
    removeInterval,
    updateSettings,
    testSound,
    requestBrowserPermission,
  };
}

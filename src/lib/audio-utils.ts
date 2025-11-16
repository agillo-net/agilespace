/**
 * Audio notification utilities for session time tracking
 */

export type NotificationSound = 'chime' | 'beep' | 'bell' | 'silent';

/**
 * Play a notification sound at the specified volume
 * @param sound - The sound to play
 * @param volume - Volume level (0-100)
 * @returns Promise that resolves when playback starts or rejects on error
 */
export async function playNotificationSound(
  sound: NotificationSound,
  volume: number
): Promise<void> {
  if (sound === 'silent') {
    return Promise.resolve();
  }

  try {
    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = Math.max(0, Math.min(100, volume)) / 100; // Clamp volume to 0-1
    await audio.play();
  } catch (error) {
    console.error('Failed to play notification sound:', error);
    throw error;
  }
}

/**
 * Request browser notification permission
 * @returns Promise resolving to permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Browser notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Show a browser notification
 * @param title - Notification title
 * @param body - Notification body text
 * @param icon - Optional icon URL
 */
export function showBrowserNotification(
  title: string,
  body: string,
  icon?: string
): void {
  if (!('Notification' in window)) {
    console.warn('Browser notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'session-notification', // Replaces previous notification
      requireInteraction: false,
    });
  }
}

/**
 * Format minutes to human-readable duration
 * @param minutes - Number of minutes
 * @returns Formatted string (e.g., "1h 30m" or "45m")
 */
export function formatMinutesToDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

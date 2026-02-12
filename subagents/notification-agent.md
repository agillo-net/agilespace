# Notification Agent

This agent specializes in user notifications, feedback systems, celebration effects, and webhook integrations within AgileSpace.

## Expertise Areas

- Toast notifications and user feedback
- Session start/end notifications
- Celebration effects and achievement feedback
- Webhook notification systems
- Real-time notification delivery
- Notification preferences and settings
- Email and push notification integration

## Key Directories and Files

- `src/lib/notifications/utils.ts` - Notification utility functions
- `src/lib/notifications/webhook.ts` - Webhook notification handling
- `src/lib/celebrate.ts` - Celebration effects using canvas-confetti
- `src/components/ui/sonner.tsx` - Toast notification component (Sonner)
- Toast notifications used throughout components for user feedback

## Toast Notification System

### Sonner Integration
```typescript
// src/components/ui/sonner.tsx
import { Toaster as Sonner } from "sonner"
import { useTheme } from "next-themes"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

### Notification Types and Patterns
```typescript
// src/lib/notifications/utils.ts
import { toast } from "sonner"

export interface NotificationOptions {
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick: () => void
  }
  description?: string
}

export const notifications = {
  // Success notifications
  success: (message: string, options?: NotificationOptions) => {
    return toast.success(message, {
      duration: options?.duration || 4000,
      description: options?.description,
      action: options?.action,
      cancel: options?.cancel
    })
  },

  // Error notifications with retry option
  error: (message: string, options?: NotificationOptions & { retry?: () => void }) => {
    return toast.error(message, {
      duration: options?.duration || 6000,
      description: options?.description,
      action: options?.retry ? {
        label: "Retry",
        onClick: options.retry
      } : options?.action,
      cancel: options?.cancel
    })
  },

  // Warning notifications
  warning: (message: string, options?: NotificationOptions) => {
    return toast.warning(message, {
      duration: options?.duration || 5000,
      description: options?.description,
      action: options?.action,
      cancel: options?.cancel
    })
  },

  // Info notifications
  info: (message: string, options?: NotificationOptions) => {
    return toast.info(message, {
      duration: options?.duration || 4000,
      description: options?.description,
      action: options?.action,
      cancel: options?.cancel
    })
  },

  // Loading notifications with progress
  loading: (message: string, options?: { description?: string }) => {
    return toast.loading(message, {
      description: options?.description
    })
  },

  // Promise-based notifications
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, messages)
  },

  // Dismiss specific notification
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId)
  },

  // Dismiss all notifications
  dismissAll: () => {
    toast.dismiss()
  }
}
```

## Session Notification System

### Session Lifecycle Notifications
```typescript
// Session start notifications
export function notifySessionStart(session: Session) {
  const trackInfo = session.track 
    ? `for ${session.track.title}` 
    : ''

  notifications.success(`Session started ${trackInfo}`, {
    description: `Working on: ${session.title}`,
    duration: 3000,
    action: {
      label: "View",
      onClick: () => navigateToSession(session.id)
    }
  })

  // Optional browser notification if permission granted
  if (Notification.permission === 'granted') {
    new Notification('Session Started', {
      body: `${session.title} ${trackInfo}`,
      icon: '/favicon.ico',
      tag: `session-${session.id}`
    })
  }
}

// Session end notifications with celebration
export function notifySessionEnd(session: Session, celebration = true) {
  const duration = session.actual_duration || 0
  const timeWorked = formatDuration(duration)

  notifications.success(`Session completed! 🎉`, {
    description: `Worked for ${timeWorked} on: ${session.title}`,
    duration: 5000,
    action: {
      label: "View Details",
      onClick: () => navigateToSession(session.id)
    }
  })

  // Trigger celebration effect
  if (celebration && duration > 300) { // 5+ minutes
    triggerCelebration(duration)
  }

  // Browser notification
  if (Notification.permission === 'granted') {
    new Notification('Session Completed!', {
      body: `Great work! You completed ${timeWorked} on ${session.title}`,
      icon: '/favicon.ico',
      tag: `session-complete-${session.id}`
    })
  }
}

// Session milestone notifications
export function notifySessionMilestone(session: Session, milestone: number) {
  const milestoneMinutes = Math.floor(milestone / 60)
  
  notifications.info(`${milestoneMinutes} minutes completed!`, {
    description: `Keep going on: ${session.title}`,
    duration: 3000
  })

  // Play subtle sound effect if available
  playNotificationSound('milestone')
}

// Session interruption warnings
export function notifySessionInterruption(session: Session, reason: string) {
  notifications.warning(`Session interrupted: ${reason}`, {
    description: `Your session "${session.title}" may be affected`,
    duration: 4000,
    action: {
      label: "Continue",
      onClick: () => resumeSession(session.id)
    }
  })
}
```

### Duration Change Request Notifications
```typescript
// Notify when duration change is requested
export function notifyDurationChangeRequested(request: SessionDurationChangeRequest) {
  notifications.info("Duration change requested", {
    description: `${formatDuration(request.old_duration)} → ${formatDuration(request.new_duration)}`,
    duration: 4000,
    action: {
      label: "View Request",
      onClick: () => navigateToChangeRequest(request.id)
    }
  })
}

// Notify when duration change is approved/rejected
export function notifyDurationChangeReviewed(
  request: SessionDurationChangeRequest,
  approved: boolean
) {
  const message = approved 
    ? "Duration change approved ✅"
    : "Duration change rejected ❌"

  const type = approved ? 'success' : 'warning'
  
  notifications[type](message, {
    description: `Request for ${formatDuration(request.new_duration)} ${approved ? 'approved' : 'rejected'}`,
    duration: 5000,
    action: {
      label: "View Session",
      onClick: () => navigateToSession(request.session_id)
    }
  })
}
```

## Celebration Effects System

### Canvas Confetti Integration
```typescript
// src/lib/celebrate.ts
import confetti from 'canvas-confetti'

export interface CelebrationOptions {
  intensity?: 'low' | 'medium' | 'high'
  duration?: number
  colors?: string[]
  shapes?: ('square' | 'circle')[]
}

export function triggerCelebration(
  sessionDuration: number,
  options: CelebrationOptions = {}
) {
  const intensity = options.intensity || getCelebrationIntensity(sessionDuration)
  const colors = options.colors || ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
  
  switch (intensity) {
    case 'low':
      triggerLowCelebration(colors)
      break
    case 'medium':
      triggerMediumCelebration(colors)
      break
    case 'high':
      triggerHighCelebration(colors)
      break
  }
}

function getCelebrationIntensity(duration: number): 'low' | 'medium' | 'high' {
  if (duration < 600) return 'low'        // < 10 minutes
  if (duration < 3600) return 'medium'    // < 1 hour
  return 'high'                           // 1+ hour
}

function triggerLowCelebration(colors: string[]) {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.8 },
    colors
  })
}

function triggerMediumCelebration(colors: string[]) {
  // Two bursts
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors
  })
  
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors
    })
  }, 250)
}

function triggerHighCelebration(colors: string[]) {
  // Spectacular celebration for long sessions
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, colors }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)
    
    // Left side
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    })
    
    // Right side
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    })
  }, 250)
}

// Achievement-specific celebrations
export function celebrateAchievement(achievement: {
  type: 'first_session' | 'streak' | 'milestone' | 'duration_record'
  value?: number
}) {
  const colors = getAchievementColors(achievement.type)
  
  switch (achievement.type) {
    case 'first_session':
      triggerFirstSessionCelebration(colors)
      break
    case 'streak':
      triggerStreakCelebration(colors, achievement.value || 1)
      break
    case 'milestone':
      triggerMilestoneCelebration(colors, achievement.value || 1)
      break
    case 'duration_record':
      triggerRecordCelebration(colors)
      break
  }
}

function getAchievementColors(type: string): string[] {
  const colorSchemes = {
    first_session: ['#10b981', '#34d399'],
    streak: ['#f59e0b', '#fbbf24'],
    milestone: ['#3b82f6', '#60a5fa'],
    duration_record: ['#ef4444', '#f87171', '#fbbf24']
  }
  
  return colorSchemes[type] || ['#10b981', '#3b82f6']
}
```

## Webhook Notification System

### Webhook Configuration and Handling
```typescript
// src/lib/notifications/webhook.ts
export interface WebhookConfig {
  url: string
  events: string[]
  secret?: string
  enabled: boolean
}

export interface WebhookPayload {
  event: string
  timestamp: string
  data: any
  space_id?: string
  user_id?: string
}

// Send webhook notifications
export async function sendWebhookNotification(
  config: WebhookConfig,
  payload: WebhookPayload
) {
  if (!config.enabled || !config.events.includes(payload.event)) {
    return
  }

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AgileSpace-Webhook/1.0',
        ...(config.secret && {
          'X-AgileSpace-Signature': await generateWebhookSignature(payload, config.secret)
        })
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Webhook notification failed:', error)
    return { success: false, error }
  }
}

// Generate webhook signature for security
async function generateWebhookSignature(payload: WebhookPayload, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(payload))
  const key = encoder.encode(secret)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data)
  const hashArray = Array.from(new Uint8Array(signature))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `sha256=${hashHex}`
}

// Session event webhooks
export function sendSessionWebhook(
  event: 'session.started' | 'session.completed' | 'session.discarded',
  session: Session,
  webhookConfigs: WebhookConfig[]
) {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data: {
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        started_at: session.started_at,
        ended_at: session.ended_at,
        duration: session.actual_duration,
        user: {
          id: session.user_id,
          name: session.user?.full_name
        },
        track: session.track ? {
          id: session.track_id,
          title: session.track.title,
          github_issue: session.track.github_issue_number
        } : null
      }
    },
    space_id: session.space_id,
    user_id: session.user_id
  }

  webhookConfigs.forEach(config => {
    sendWebhookNotification(config, payload)
  })
}

// Duration change webhooks
export function sendDurationChangeWebhook(
  event: 'duration_change.requested' | 'duration_change.approved' | 'duration_change.rejected',
  request: SessionDurationChangeRequest,
  webhookConfigs: WebhookConfig[]
) {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data: {
      change_request: {
        id: request.id,
        session_id: request.session_id,
        old_duration: request.old_duration,
        new_duration: request.new_duration,
        reason: request.reason,
        status: request.status,
        requester: request.requester_id,
        reviewer: request.reviewer_id
      }
    }
  }

  webhookConfigs.forEach(config => {
    sendWebhookNotification(config, payload)
  })
}
```

## Browser Notification Integration

### Permission Management
```typescript
// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Check if notifications are supported and enabled
export function canSendNotifications(): boolean {
  return (
    'Notification' in window &&
    Notification.permission === 'granted'
  )
}

// Send browser notification
export function sendBrowserNotification(
  title: string,
  options: {
    body?: string
    icon?: string
    badge?: string
    tag?: string
    requireInteraction?: boolean
    actions?: Array<{
      action: string
      title: string
      icon?: string
    }>
  } = {}
) {
  if (!canSendNotifications()) {
    return null
  }

  const notification = new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options
  })

  // Auto-close after 5 seconds unless requireInteraction is true
  if (!options.requireInteraction) {
    setTimeout(() => notification.close(), 5000)
  }

  return notification
}
```

### Session Focus Notifications
```typescript
// Notify when user switches away from active session
export function setupSessionFocusNotifications() {
  let isActive = true
  let focusLostTime: number | null = null

  const handleVisibilityChange = () => {
    if (document.hidden) {
      // User switched away
      isActive = false
      focusLostTime = Date.now()
    } else {
      // User returned
      isActive = true
      
      if (focusLostTime) {
        const timeAway = Date.now() - focusLostTime
        
        // If away for more than 5 minutes, show welcome back notification
        if (timeAway > 5 * 60 * 1000) {
          notifications.info("Welcome back!", {
            description: `You were away for ${formatDuration(Math.floor(timeAway / 1000))}`,
            duration: 3000
          })
        }
        
        focusLostTime = null
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}
```

## Real-time Notification Delivery

### Supabase Real-time Integration
```typescript
// Subscribe to space notifications
export function useSpaceNotifications(spaceId: string) {
  const { user } = useAuth()
  
  useEffect(() => {
    if (!spaceId || !user) return

    const channel = supabase
      .channel(`space-${spaceId}-notifications`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `space_id=eq.${spaceId}`
        },
        (payload) => {
          handleRealtimeNotification(payload.new, user.id)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [spaceId, user])
}

function handleRealtimeNotification(notification: any, currentUserId: string) {
  // Don't show notifications for own actions
  if (notification.triggered_by === currentUserId) {
    return
  }

  switch (notification.type) {
    case 'member_joined':
      notifications.info(`${notification.data.member_name} joined the space`, {
        duration: 4000
      })
      break
      
    case 'session_started':
      notifications.info(`${notification.data.user_name} started a session`, {
        description: notification.data.session_title,
        duration: 3000
      })
      break
      
    case 'session_completed':
      notifications.success(`${notification.data.user_name} completed a session`, {
        description: `${notification.data.session_title} (${formatDuration(notification.data.duration)})`,
        duration: 4000
      })
      break
      
    case 'duration_change_requested':
      notifications.warning("Duration change requires review", {
        description: `${notification.data.requester_name} requested a change`,
        duration: 5000,
        action: {
          label: "Review",
          onClick: () => navigateToChangeRequests()
        }
      })
      break
  }
}
```

## Notification Preferences

### User Notification Settings
```typescript
export interface NotificationPreferences {
  enableToasts: boolean
  enableBrowser: boolean
  enableWebhooks: boolean
  sessionEvents: {
    start: boolean
    complete: boolean
    milestones: boolean
  }
  spaceEvents: {
    memberJoined: boolean
    memberLeft: boolean
    roleChanged: boolean
  }
  changeRequests: {
    requested: boolean
    approved: boolean
    rejected: boolean
  }
  celebrations: {
    enabled: boolean
    intensity: 'low' | 'medium' | 'high'
    sound: boolean
  }
}

// Load user preferences
export function useNotificationPreferences() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: () => getNotificationPreferences(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 10 // 10 minutes
  })
}

// Update preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (preferences, variables) => {
      queryClient.setQueryData(['notification-preferences', variables.userId], preferences)
      
      notifications.success("Notification preferences updated", {
        duration: 3000
      })
    }
  })
}

// Apply preferences to notifications
export function createNotificationWithPreferences(
  type: keyof NotificationPreferences,
  notification: () => void,
  preferences: NotificationPreferences
) {
  const shouldNotify = preferences[type] && preferences.enableToasts
  
  if (shouldNotify) {
    notification()
  }
}
```

## Sound Notification System

### Audio Notification Management
```typescript
// Audio notification utilities
export class AudioNotificationManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  
  constructor() {
    this.init()
  }
  
  private async init() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      await this.loadSounds()
    } catch (error) {
      console.warn('Audio notifications not available:', error)
    }
  }
  
  private async loadSounds() {
    const soundFiles = {
      session_start: '/sounds/session-start.mp3',
      session_complete: '/sounds/session-complete.mp3',
      milestone: '/sounds/milestone.mp3',
      notification: '/sounds/notification.mp3'
    }
    
    for (const [name, url] of Object.entries(soundFiles)) {
      try {
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
        this.sounds.set(name, audioBuffer)
      } catch (error) {
        console.warn(`Failed to load sound ${name}:`, error)
      }
    }
  }
  
  public playSound(soundName: string, volume = 0.5) {
    if (!this.audioContext || !this.sounds.has(soundName)) {
      return
    }
    
    const audioBuffer = this.sounds.get(soundName)!
    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()
    
    source.buffer = audioBuffer
    gainNode.gain.value = volume
    
    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    source.start()
  }
}

// Global audio manager instance
export const audioManager = new AudioNotificationManager()

// Play notification sound
export function playNotificationSound(type: string, preferences?: NotificationPreferences) {
  if (preferences?.celebrations.sound !== false) {
    audioManager.playSound(type)
  }
}
```

## Integration Points

### Session Tracking Integration
- Session lifecycle notifications (start, end, milestones)
- Duration change request notifications
- Session achievement celebrations

### Space Management Integration
- Member addition/removal notifications
- Role change notifications
- Space activity summaries

### GitHub Integration
- Issue assignment notifications
- Pull request notifications
- Webhook integrations with external tools

### Error Handling Integration
- Error notification display
- Retry action notifications
- Network status notifications
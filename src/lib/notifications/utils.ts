import { sendGoogleChatNotification } from './webhook'
import type { User } from '@supabase/supabase-js'

export type StatusUpdate = {
    status: string
    location: string
}

export type SessionEvent = {
    type: 'start' | 'end'
    trackTitle: string
    duration?: number
}

export type NotificationEvent = 
    | { type: 'status_update'; data: StatusUpdate }
    | { type: 'session_event'; data: SessionEvent }

export function formatStatusMessage(user: User | null, update: StatusUpdate): string {
    if (!user?.user_metadata?.full_name) {
        return 'Unknown user updated their status'
    }

    const full_name = user.user_metadata.full_name.trim()
    const status = update.status.charAt(0).toUpperCase() + update.status.slice(1)

    if (update.status === 'offline') {
        return `*${full_name}* is now ${status}`
    }

    const location = update.location === 'office' ? 'in the office' : 'working remotely'
    return `*${full_name}* is now ${status} and ${location}`
}

export function formatSessionMessage(user: User | null, event: SessionEvent): string {
    if (!user?.user_metadata?.full_name) {
        return 'Unknown user session activity'
    }

    const full_name = user.user_metadata.full_name.trim()
    const trackTitle = event.trackTitle.length > 50 ? `${event.trackTitle.substring(0, 50)}...` : event.trackTitle

    if (event.type === 'start') {
        return `*${full_name}* started working on: ${trackTitle}`
    } else {
        const durationText = event.duration ? ` (${formatDuration(event.duration)})` : ''
        return `*${full_name}* finished working on: ${trackTitle}${durationText}`
    }
}

function formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
        return `${minutes}m`
    } else {
        return `${seconds}s`
    }
}

export async function sendNotification(user: User | null, event: NotificationEvent) {
    try {
        let message: string
        
        switch (event.type) {
            case 'status_update':
                message = formatStatusMessage(user, event.data)
                break
            case 'session_event':
                message = formatSessionMessage(user, event.data)
                break
            default:
                throw new Error('Unknown notification event type')
        }
        
        await sendGoogleChatNotification(message)
    } catch (error) {
        console.error('Failed to send notification:', error)
    }
}

export async function notifyStatusUpdate(user: User | null, update: StatusUpdate) {
    await sendNotification(user, { type: 'status_update', data: update })
}

export async function notifySessionEvent(user: User | null, event: SessionEvent) {
    await sendNotification(user, { type: 'session_event', data: event })
} 

import { sendGoogleChatNotification } from './webhook'
import type { User } from '@supabase/supabase-js'

export type StatusUpdate = {
    status: string
    location: string
}

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

export async function notifyStatusUpdate(user: User | null, update: StatusUpdate) {
    try {
        const message = formatStatusMessage(user, update)
        await sendGoogleChatNotification(message)
    } catch (error) {
        console.error('Failed to send status update notification:', error)
    }
} 

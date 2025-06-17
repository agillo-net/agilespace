import { getSupabaseClient } from '../supabase/client'

export async function sendGoogleChatNotification(message: string) {
    try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.functions.invoke('google-chat-webhook', {
            body: { message }
        })

        if (error) {
            throw new Error(error.message)
        }

        if (!data.success) {
            throw new Error('Failed to send notification')
        }
    } catch (error) {
        console.error('Error sending Google Chat notification:', error)
        throw error
    }
} 

export async function sendGoogleChatNotification(message: string) {
    const webhookUrl = import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn('Google Chat webhook URL not configured');
        return;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: message
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to send notification: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error sending Google Chat notification:', error);
        throw error;
    }
} 

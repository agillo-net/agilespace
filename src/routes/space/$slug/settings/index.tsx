import { createFileRoute } from '@tanstack/react-router';
import { Settings as SettingsIcon } from 'lucide-react';
import { AudioNotificationSettings } from '@/components/settings/audio-notification-settings';

export const Route = createFileRoute('/space/$slug/settings/')({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your preferences and notification settings
        </p>
      </div>

      <AudioNotificationSettings />
    </div>
  );
}

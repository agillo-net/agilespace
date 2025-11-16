import { useState } from 'react';
import { Volume2, Bell, Plus, X, TestTube } from 'lucide-react';
import { useAudioNotificationSettings } from '@/hooks/use-audio-notifications';
import { formatMinutesToDuration, type NotificationSound } from '@/lib/audio-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function AudioNotificationSettings() {
  const {
    settings,
    addInterval,
    removeInterval,
    updateSettings,
    testSound,
    requestBrowserPermission,
  } = useAudioNotificationSettings();

  const [newIntervalInput, setNewIntervalInput] = useState('');

  const handleAddInterval = () => {
    const minutes = parseInt(newIntervalInput, 10);
    if (!isNaN(minutes) && minutes > 0 && minutes <= 480) {
      addInterval(minutes);
      setNewIntervalInput('');
    }
  };

  const handleVolumeChange = (value: number[]) => {
    updateSettings({ volume: value[0] });
  };

  const handleBrowserNotificationToggle = async (checked: boolean) => {
    if (checked) {
      await requestBrowserPermission();
    } else {
      updateSettings({ browserNotifications: false });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Enable/Disable */}
      <Card>
        <CardHeader>
          <CardTitle>Audio Notifications</CardTitle>
          <CardDescription>
            Get notified when you've been working on a session for a specified duration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-notifications">Enable Audio Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive audio alerts during active sessions
              </p>
            </div>
            <Switch
              id="enable-notifications"
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSettings({ enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Intervals */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Intervals</CardTitle>
          <CardDescription>
            Set custom time intervals for notifications (in minutes)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Intervals */}
          <div className="space-y-2">
            <Label>Active Intervals</Label>
            <div className="flex flex-wrap gap-2">
              {settings.intervals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No intervals configured</p>
              ) : (
                settings.intervals.map((interval) => (
                  <Badge key={interval} variant="secondary" className="flex items-center gap-1">
                    {formatMinutesToDuration(interval)}
                    <button
                      onClick={() => removeInterval(interval)}
                      className="ml-1 hover:text-destructive"
                      disabled={!settings.enabled}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Add New Interval */}
          <div className="space-y-2">
            <Label htmlFor="new-interval">Add New Interval</Label>
            <div className="flex gap-2">
              <Input
                id="new-interval"
                type="number"
                min="1"
                max="480"
                placeholder="Enter minutes (e.g., 30, 60, 90)"
                value={newIntervalInput}
                onChange={(e) => setNewIntervalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddInterval();
                  }
                }}
                disabled={!settings.enabled}
              />
              <Button
                onClick={handleAddInterval}
                disabled={!settings.enabled || !newIntervalInput}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add time intervals between 1-480 minutes (8 hours)
            </p>
          </div>

          {/* Repeat Notifications */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="repeat-notifications">Repeat Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Continue playing notifications every interval until session ends
              </p>
            </div>
            <Switch
              id="repeat-notifications"
              checked={settings.repeat}
              onCheckedChange={(checked) => updateSettings({ repeat: checked })}
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sound Settings
          </CardTitle>
          <CardDescription>Customize your notification sound and volume</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sound Selection */}
          <div className="space-y-2">
            <Label htmlFor="sound-select">Notification Sound</Label>
            <Select
              value={settings.sound}
              onValueChange={(value) => updateSettings({ sound: value as NotificationSound })}
              disabled={!settings.enabled}
            >
              <SelectTrigger id="sound-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chime">Chime</SelectItem>
                <SelectItem value="beep">Beep</SelectItem>
                <SelectItem value="bell">Bell</SelectItem>
                <SelectItem value="silent">Silent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="volume-slider">Volume</Label>
              <span className="text-sm text-muted-foreground">{settings.volume}%</span>
            </div>
            <Slider
              id="volume-slider"
              min={0}
              max={100}
              step={5}
              value={[settings.volume]}
              onValueChange={handleVolumeChange}
              disabled={!settings.enabled || settings.sound === 'silent'}
            />
          </div>

          {/* Test Sound Button */}
          <Button
            onClick={testSound}
            disabled={!settings.enabled || settings.sound === 'silent'}
            variant="outline"
            className="w-full"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test Sound
          </Button>
        </CardContent>
      </Card>

      {/* Browser Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Browser Notifications
          </CardTitle>
          <CardDescription>
            Receive native browser notifications (works when tab is in background)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="browser-notifications">Enable Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">
                {typeof window !== 'undefined' && 'Notification' in window
                  ? Notification.permission === 'granted'
                    ? 'Permission granted'
                    : Notification.permission === 'denied'
                      ? 'Permission denied - check browser settings'
                      : 'Permission required'
                  : 'Not supported in this browser'}
              </p>
            </div>
            <Switch
              id="browser-notifications"
              checked={settings.browserNotifications}
              onCheckedChange={handleBrowserNotificationToggle}
              disabled={
                !settings.enabled ||
                (typeof window !== 'undefined' &&
                  (!('Notification' in window) || Notification.permission === 'denied'))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>How it works:</strong> When you have an active session, you'll receive
            notifications at your configured intervals. Notifications include audio alerts, toast
            messages, visual indicators on the timer, and optional browser notifications.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

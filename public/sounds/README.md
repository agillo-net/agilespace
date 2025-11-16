# Audio Notification Sounds

This directory contains audio files for session time tracking notifications.

## Required Audio Files

The following audio files need to be placed in this directory:

1. **chime.mp3** - A gentle chime sound (default)
2. **beep.mp3** - A simple beep notification
3. **bell.mp3** - A bell-like notification sound

## Audio File Requirements

- **Format**: MP3
- **Duration**: 1-3 seconds recommended
- **Volume**: Normalized to prevent sudden loud sounds
- **Sample Rate**: 44.1 kHz or 48 kHz
- **Bitrate**: 128-320 kbps

## Where to Get Free Notification Sounds

You can download free notification sounds from:

- [Freesound.org](https://freesound.org/) - Search for "notification", "chime", "beep", or "bell"
- [Zapsplat.com](https://www.zapsplat.com/) - Free sound effects
- [Mixkit.co](https://mixkit.co/free-sound-effects/) - Free sound effects

## Creating Your Own Sounds

You can also create simple notification sounds using:

### macOS (using `say` command):
```bash
# Generate a simple beep (requires additional audio processing)
say "Notification" -o beep.aiff
# Convert to MP3 using ffmpeg
ffmpeg -i beep.aiff -acodec libmp3lame beep.mp3
```

### Using Online Tools:
- [Online Tone Generator](https://www.szynalski.com/tone-generator/)
- [Audacity](https://www.audacityteam.org/) - Free audio editor

## Testing

Use the "Test Sound" button in the Settings page to preview how each sound will play in the application.

## Note

If you don't add audio files, the application will still work but audio playback will fail silently. You can still use:
- Toast notifications
- Visual indicators on the timer
- Browser notifications

Or set the sound to "Silent" in the settings to disable audio entirely.

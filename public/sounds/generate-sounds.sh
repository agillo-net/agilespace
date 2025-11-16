#!/bin/bash

# This script generates simple notification sounds using ffmpeg
# Install ffmpeg first: brew install ffmpeg (on macOS)

if ! command -v ffmpeg &> /dev/null; then
    echo "ffmpeg not found. Please install it first:"
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu: sudo apt-get install ffmpeg"
    exit 1
fi

# Generate a gentle chime (440Hz for 5s, with fade in and fade out)
ffmpeg -f lavfi -i "sine=frequency=440:duration=5" -af "afade=t=in:st=0:d=0.5,afade=t=out:st=4.5:d=0.5" -y chime.mp3

# Generate a beep (800Hz for 5s, with fade in and fade out)
ffmpeg -f lavfi -i "sine=frequency=800:duration=5" -af "afade=t=in:st=0:d=0.3,afade=t=out:st=4.7:d=0.3" -y beep.mp3

# Generate a bell (combination of frequencies for 5s, with fade out)
ffmpeg -f lavfi -i "sine=frequency=523.25:duration=5" -af "afade=t=in:st=0:d=0.5,afade=t=out:st=4:d=1" -y bell.mp3

echo "Sound files generated successfully!"
echo "Generated: chime.mp3 (5s), beep.mp3 (5s), bell.mp3 (5s)"

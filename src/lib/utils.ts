import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTime = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

export const getSessionDuration = (startedAt: string, endedAt: string) => {
  const start = new Date(startedAt).getTime()
  const end = new Date(endedAt).getTime()
  return formatTime(end - start)
}

export const isLightColor = (color: string) => {
  // Remove the # if present
  const hex = color.replace('#', '');
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

export const getGitHubIssueUrl = (track: { repo_owner: string; repo_name: string; issue_number: number }) => {
  return `https://github.com/${track.repo_owner}/${track.repo_name}/issues/${track.issue_number}`
};

export const formatSessionComment = (duration: number, message: string) => {
  const timeSpent = formatTime(duration)
  return `## Session Summary\n\n**Time spent:** ${timeSpent}\n\n${message}`
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function githubRedirect() {
  const githubURL = "https://github.com"
  return {
    accountOrOrg(org: string) {
      return `${githubURL}/${org}`
    },
  }
}

export const isDev = import.meta.env.DEV

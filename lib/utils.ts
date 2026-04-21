import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTitleCase(str: string): string {
  if (!str) return "";
  return str
    .split(/(\s+)/)
    .map((word) =>
      word.trim().length > 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word
    )
    .join("");
}

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

export function formatCurrency(val: string): string {
  // Extract only digits
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";

  // Convert to number and format with commas
  const amount = parseInt(digits, 10);
  return "$" + amount.toLocaleString("en-US");
}

export function initialsFromName(name: string, email: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  if (parts[0] && parts[0].length > 0) return parts[0][0]!.toUpperCase();
  return email[0]?.toUpperCase() ?? "?";
}

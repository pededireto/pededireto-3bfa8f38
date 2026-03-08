import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a full name into privacy-safe display: "Telmo Resgate" → "Telmo R."
 * Never exposes full surname publicly.
 */
export function formatReviewerName(fullName: string | null | undefined): string {
  if (!fullName || fullName.trim() === "") return "Cliente verificado";
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0];
  const lastInitial =
    parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
  return `${firstName}${lastInitial}`;
}

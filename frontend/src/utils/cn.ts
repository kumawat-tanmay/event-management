import { clsx, type ClassValue } from "clsx";
// @ts-expect-error: tailwind-merge type issues
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

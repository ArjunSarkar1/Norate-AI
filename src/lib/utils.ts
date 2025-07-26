import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabaseClient"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error("No authentication token available");
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });
}

import { NextRequest } from "next/server";
import { supabase } from "./supabaseClient";

export async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuth(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
} 
import { NextRequest } from "next/server";
import { supabase } from "./supabaseClient";
import { prisma } from "@/db/prisma";

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

  // Sync user with our database
  try {
    const dbUser = await prisma.user.upsert({
      where: { email: user.email! },
      update: {},
      create: {
        id: user.id,
        email: user.email!,
      },
    });
    
    return dbUser;
  } catch (error) {
    console.error("Error syncing user:", error);
    return null;
  }
}

export async function requireAuth(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
} 
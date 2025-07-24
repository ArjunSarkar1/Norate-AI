import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const { id, email, name } = await req.json();
    if (!id || !email) {
      return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
    }
    // Create user in Prisma DB if not exists
    const user = await prisma.user.upsert({
      where: { id },
      update: { email, updatedAt: new Date() },
      create: { id, email, createdAt: new Date(), updatedAt: new Date() },
    });
    return NextResponse.json({ user });
  } catch (error) {
    let message = "Internal server error";
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 
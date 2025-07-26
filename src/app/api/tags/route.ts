import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/tags - Fetch all tags
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      include: {
        notes: {
          where: {
            userId: user.id,
          },
        },
      },
    });

    // Only return tags that have notes for this user
    const userTags = tags.filter((tag: any) => tag.notes.length > 0);

    return NextResponse.json({ tags: userTags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tags - Create new tag
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check if tag already exists
    const existingTag = await prisma.tag.findUnique({
      where: {
        name: trimmedName,
      },
    });

    if (existingTag) {
      return NextResponse.json({ tag: existingTag });
    }

    // Create the tag
    const tag = await prisma.tag.create({
      data: {
        name: trimmedName,
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
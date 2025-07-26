import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/notes/[id] - Fetch single note
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await prisma.note.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        tags: true,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/notes/[id] - Update note
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, summary, tagIds } = await req.json();

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Update the note
    const note = await prisma.note.update({
      where: {
        id: params.id,
      },
      data: {
        title: title !== undefined ? title : undefined,
        content: content !== undefined ? content : undefined,
        summary: summary !== undefined ? summary : undefined,
        tags: tagIds ? {
          set: [], // Clear existing tags
          connect: tagIds.map((id: string) => ({ id })),
        } : undefined,
        updatedAt: new Date(),
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/[id] - Delete note
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Delete the note
    await prisma.note.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
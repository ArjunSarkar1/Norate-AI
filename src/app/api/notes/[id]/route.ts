import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  generateEmbedding,
  extractTextFromTipTapContent,
} from "@/lib/ai-service";

interface NoteTag {
  tag: {
    id: string;
    name: string;
  };
}

// GET /api/notes/[id] - Fetch single note
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const note = await prisma.note.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        noteTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Transform the data to match the expected format
    const transformedNote = {
      ...note,
      tags: note.noteTags.map((noteTag: NoteTag) => noteTag.tag),
    };

    return NextResponse.json({ note: transformedNote });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/notes/[id] - Update note
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, content, summary, tagIds } = await req.json();

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Generate new embedding if content was updated
    let embedding: number[] | undefined = undefined;
    if (content !== undefined) {
      try {
        const text = extractTextFromTipTapContent(content);
        const fullText = `${title || existingNote.title || ""} ${text}`.trim();

        if (fullText.length >= 10) {
          const embeddingResult = await generateEmbedding(fullText);
          embedding = embeddingResult.embedding;
        }
      } catch (embeddingError) {
        console.warn(
          "Failed to generate embedding for updated note:",
          embeddingError,
        );
        // Don't fail the note update if embedding generation fails
      }
    }

    // Update the note
    await prisma.note.update({
      where: {
        id: id,
      },
      data: {
        title: title !== undefined ? title : undefined,
        content: content !== undefined ? content : undefined,
        summary: summary !== undefined ? summary : undefined,
        embedding: embedding !== undefined ? embedding : undefined,
        updatedAt: new Date(),
      },
    });

    // Update tags if provided
    if (tagIds !== undefined) {
      // Remove existing tags
      await prisma.noteTag.deleteMany({
        where: {
          noteId: id,
        },
      });

      // Add new tags
      if (tagIds && tagIds.length > 0) {
        await prisma.noteTag.createMany({
          data: tagIds.map((tagId: string) => ({
            noteId: id,
            tagId: tagId,
          })),
        });
      }
    }

    // Fetch the updated note with tags
    const updatedNote = await prisma.note.findUnique({
      where: { id: id },
      include: {
        noteTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({
      note: {
        ...updatedNote,
        tags:
          updatedNote?.noteTags.map((noteTag: NoteTag) => noteTag.tag) || [],
      },
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/notes/[id] - Delete note
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Delete associated note tags first (cascading should handle this, but being explicit)
    await prisma.noteTag.deleteMany({
      where: {
        noteId: id,
      },
    });

    // Delete the note
    await prisma.note.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

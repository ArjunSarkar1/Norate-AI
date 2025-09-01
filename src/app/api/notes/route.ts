import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { JsonValue } from "@prisma/client/runtime/library";

interface NoteTag {
  tag: {
    id: string;
    name: string;
  };
}

interface NoteWithTags {
  id: string;
  title: string | null;
  content: JsonValue;
  summary: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  noteTags: NoteTag[];
}

// GET /api/notes - Fetch all notes for authenticated user
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await prisma.note.findMany({
      where: {
        userId: user.id,
      },
      include: {
        noteTags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform the data to match the expected format
    const transformedNotes = notes.map((note: NoteWithTags) => ({
      ...note,
      tags: note.noteTags.map((noteTag: NoteTag) => noteTag.tag),
    }));

    return NextResponse.json({ notes: transformedNotes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/notes - Create new note
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, tagIds } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    // Create the note first
    const note = await prisma.note.create({
      data: {
        title: title || null,
        content: content,
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

    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      await prisma.noteTag.createMany({
        data: tagIds.map((tagId: string) => ({
          noteId: note.id,
          tagId: tagId,
        })),
      });

      // Fetch the note again with tags
      const updatedNote = await prisma.note.findUnique({
        where: { id: note.id },
        include: {
          noteTags: {
            include: {
              tag: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          note: {
            ...updatedNote,
            tags:
              updatedNote?.noteTags.map((noteTag: NoteTag) => noteTag.tag) ||
              [],
          },
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        note: {
          ...note,
          tags: [],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

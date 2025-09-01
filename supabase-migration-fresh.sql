-- Supabase Migration: Fresh Installation Schema
-- Use this script for new installations or if you want to start fresh
-- WARNING: This will drop existing data!

-- Drop existing tables in correct order (foreign keys first)
DROP TABLE IF EXISTS "_NoteTags";
DROP TABLE IF EXISTS "NoteTag";
DROP TABLE IF EXISTS "Note";
DROP TABLE IF EXISTS "Tag";
DROP TABLE IF EXISTS "User";

-- Create User table
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Note table
CREATE TABLE "Note" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT,
    "content" JSONB NOT NULL,
    "summary" TEXT,
    "embedding" DOUBLE PRECISION[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Tag table
CREATE TABLE "Tag" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create NoteTag junction table
CREATE TABLE "NoteTag" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "noteId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NoteTag_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NoteTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NoteTag_noteId_tagId_key" UNIQUE ("noteId", "tagId")
);

-- Create function to automatically update updatedAt timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updatedAt updates
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_updated_at
    BEFORE UPDATE ON "Note"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tag_updated_at
    BEFORE UPDATE ON "Tag"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_tag_updated_at
    BEFORE UPDATE ON "NoteTag"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NoteTag" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own profile" ON "User"
    FOR ALL USING ("id" = auth.uid()::text);

CREATE POLICY "Users can manage their own notes" ON "Note"
    FOR ALL USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can manage their own tags" ON "Tag"
    FOR ALL USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can manage their own note tags" ON "NoteTag"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Note"
            WHERE "Note"."id" = "NoteTag"."noteId"
            AND "Note"."userId" = auth.uid()::text
        )
    );

-- Create indexes for better performance
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Note_userId_idx" ON "Note"("userId");
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");
CREATE INDEX "Note_updatedAt_idx" ON "Note"("updatedAt");
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");
CREATE INDEX "Tag_name_idx" ON "Tag"("name");
CREATE INDEX "NoteTag_noteId_idx" ON "NoteTag"("noteId");
CREATE INDEX "NoteTag_tagId_idx" ON "NoteTag"("tagId");

-- Add helpful comments
COMMENT ON TABLE "User" IS 'Application users with authentication integration';
COMMENT ON TABLE "Note" IS 'User notes with rich content stored as JSONB';
COMMENT ON TABLE "Tag" IS 'User-defined tags for organizing notes';
COMMENT ON TABLE "NoteTag" IS 'Junction table for many-to-many relationship between Notes and Tags';

COMMENT ON COLUMN "Note"."content" IS 'Rich text content stored as TipTap JSON format';
COMMENT ON COLUMN "Note"."embedding" IS 'Vector embeddings for AI search functionality';
COMMENT ON COLUMN "Tag"."userId" IS 'References the user who owns this tag';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Fresh database schema created successfully!';
    RAISE NOTICE 'All tables, triggers, RLS policies, and indexes have been set up.';
    RAISE NOTICE 'You can now start using your Norate AI application.';
END $$;

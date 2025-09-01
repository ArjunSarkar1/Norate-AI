-- Supabase Migration: Update database schema to match Prisma changes
-- Run this script in your Supabase SQL editor

-- First, drop the existing many-to-many table if it exists
DROP TABLE IF EXISTS "_NoteTags";

-- Update the Tag table to include userId and timestamps (only if columns don't exist)
DO $$
BEGIN
    -- Add userId column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tag' AND column_name = 'userId') THEN
        ALTER TABLE "Tag" ADD COLUMN "userId" TEXT;
    END IF;

    -- Add createdAt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tag' AND column_name = 'createdAt') THEN
        ALTER TABLE "Tag" ADD COLUMN "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add updatedAt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tag' AND column_name = 'updatedAt') THEN
        ALTER TABLE "Tag" ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- IMPORTANT: Update existing tags to have a userId before making it required
-- You'll need to replace 'your-user-id' with an actual user ID from your User table
-- Uncomment and modify the following line:
-- UPDATE "Tag" SET "userId" = 'your-user-id' WHERE "userId" IS NULL;

-- Make userId required (uncomment after updating existing tags)
-- ALTER TABLE "Tag" ALTER COLUMN "userId" SET NOT NULL;

-- Create the new NoteTag junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS "NoteTag" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "noteId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint to prevent duplicate note-tag relationships
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NoteTag_noteId_tagId_key') THEN
        ALTER TABLE "NoteTag" ADD CONSTRAINT "NoteTag_noteId_tagId_key" UNIQUE ("noteId", "tagId");
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add NoteTag -> Note foreign key
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NoteTag_noteId_fkey') THEN
        ALTER TABLE "NoteTag" ADD CONSTRAINT "NoteTag_noteId_fkey"
        FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add NoteTag -> Tag foreign key
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NoteTag_tagId_fkey') THEN
        ALTER TABLE "NoteTag" ADD CONSTRAINT "NoteTag_tagId_fkey"
        FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add Tag -> User foreign key (only after userId is set and NOT NULL)
    -- Uncomment after updating existing tags:
    -- IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tag_userId_fkey') THEN
    --     ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey"
    --     FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    -- END IF;
END $$;

-- Update Note foreign key to cascade deletes
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Note_userId_fkey') THEN
        ALTER TABLE "Note" DROP CONSTRAINT "Note_userId_fkey";
    END IF;

    -- Add new constraint with CASCADE
    ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END $$;

-- Create function to automatically update updatedAt timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updatedAt updates
DROP TRIGGER IF EXISTS update_tag_updated_at ON "Tag";
CREATE TRIGGER update_tag_updated_at
    BEFORE UPDATE ON "Tag"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_note_tag_updated_at ON "NoteTag";
CREATE TRIGGER update_note_tag_updated_at
    BEFORE UPDATE ON "NoteTag"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security) for the new tables
ALTER TABLE "NoteTag" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for NoteTag table
DROP POLICY IF EXISTS "Users can manage their own note tags" ON "NoteTag";
CREATE POLICY "Users can manage their own note tags" ON "NoteTag"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Note"
            WHERE "Note"."id" = "NoteTag"."noteId"
            AND "Note"."userId" = auth.uid()::text
        )
    );

-- Update RLS policy for Tag table to include userId
DROP POLICY IF EXISTS "Users can manage their own tags" ON "Tag";
-- Uncomment after userId is properly set and NOT NULL:
-- CREATE POLICY "Users can manage their own tags" ON "Tag"
--     FOR ALL USING ("userId" = auth.uid()::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "NoteTag_noteId_idx" ON "NoteTag"("noteId");
CREATE INDEX IF NOT EXISTS "NoteTag_tagId_idx" ON "NoteTag"("tagId");
CREATE INDEX IF NOT EXISTS "Tag_userId_idx" ON "Tag"("userId");
CREATE INDEX IF NOT EXISTS "Note_userId_idx" ON "Note"("userId");

-- Add helpful comments
COMMENT ON TABLE "NoteTag" IS 'Junction table for many-to-many relationship between Notes and Tags';
COMMENT ON COLUMN "Tag"."userId" IS 'References the user who owns this tag';

-- Instructions for completing the migration:
-- 1. Run this script in your Supabase SQL editor
-- 2. Update existing tags with actual user IDs:
--    UPDATE "Tag" SET "userId" = 'actual-user-id-here' WHERE "userId" IS NULL;
-- 3. Uncomment and run the ALTER TABLE command to make userId NOT NULL
-- 4. Uncomment and run the foreign key constraint for Tag -> User
-- 5. Uncomment and run the RLS policy for Tag table

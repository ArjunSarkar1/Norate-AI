# Database Migration Guide for Norate AI

This guide will help you migrate your Supabase database to work with the updated Norate AI schema and functionality.

## Overview

The migration updates the database schema to:
- Fix note-tag relationships with a proper junction table
- Add user ownership to tags
- Enable proper cascade deletes
- Add performance indexes
- Set up Row Level Security (RLS) policies

## Migration Options

### Option 1: Fresh Installation (Recommended for New Projects)

If you're starting fresh or don't have important data to preserve:

1. **Go to Supabase Dashboard** → Your Project → SQL Editor
2. **Copy and run** the contents of `supabase-migration-fresh.sql`
3. **Verify** tables are created successfully
4. **Start using** the application

### Option 2: Update Existing Database

If you have existing data you want to preserve:

#### Step 1: Backup Your Data (Important!)
```sql
-- Export your existing data first
SELECT * FROM "Note";
SELECT * FROM "Tag";
SELECT * FROM "User";
```

#### Step 2: Run the Migration Script
1. **Go to Supabase Dashboard** → Your Project → SQL Editor
2. **Copy and run** the contents of `supabase-migration.sql`

#### Step 3: Handle Existing Tags
The migration script includes commented sections that you need to complete manually:

```sql
-- Find a user ID from your User table
SELECT id FROM "User" LIMIT 1;

-- Update existing tags with a user ID (replace 'your-user-id' with actual ID)
UPDATE "Tag" SET "userId" = 'your-actual-user-id-here' WHERE "userId" IS NULL;

-- Make userId required
ALTER TABLE "Tag" ALTER COLUMN "userId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS policy for tags
CREATE POLICY "Users can manage their own tags" ON "Tag"
    FOR ALL USING ("userId" = auth.uid()::text);
```

## Verification Steps

After running the migration, verify everything is working:

### 1. Check Table Structure
```sql
-- Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('User', 'Note', 'Tag', 'NoteTag');

-- Check NoteTag table structure
\d "NoteTag"
```

### 2. Check Constraints
```sql
-- Verify foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('Note', 'Tag', 'NoteTag');
```

### 3. Check RLS Policies
```sql
-- Verify RLS policies are active
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('User', 'Note', 'Tag', 'NoteTag');
```

## Troubleshooting

### Common Issues

#### Issue: "relation does not exist"
**Solution**: Make sure you're running the script in the correct database schema (usually `public`).

#### Issue: "constraint already exists"
**Solution**: The migration script includes checks for existing constraints. If you get this error, the constraint already exists and you can safely ignore it.

#### Issue: "column already exists"
**Solution**: The migration script includes checks for existing columns. This error means the column was already added.

#### Issue: Foreign key constraint fails
**Solution**: Make sure all referenced data exists. For example, if you have tags without a userId, you need to update them first.

### Rollback Plan

If something goes wrong, you can rollback using your backup:

```sql
-- Drop the new tables
DROP TABLE IF EXISTS "NoteTag";

-- Restore your original data
-- (Use your backup data here)
```

## Post-Migration Steps

### 1. Update Your Application
- Make sure your local development environment has the latest code
- Run `pnpm dlx prisma generate` to update the Prisma client
- Test the application locally

### 2. Environment Variables
Ensure these environment variables are set:
```env
DATABASE_URL=your_supabase_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Test Core Functionality
- [ ] User can create new notes
- [ ] User can edit existing notes  
- [ ] User can delete notes
- [ ] User can add tags to notes
- [ ] User can remove tags from notes
- [ ] Toast notifications appear for all actions
- [ ] Auto-save works correctly

## Performance Optimization

The migration includes several indexes for better performance:

```sql
-- Key indexes created:
CREATE INDEX "Note_userId_idx" ON "Note"("userId");
CREATE INDEX "Note_updatedAt_idx" ON "Note"("updatedAt");
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");
CREATE INDEX "NoteTag_noteId_idx" ON "NoteTag"("noteId");
CREATE INDEX "NoteTag_tagId_idx" ON "NoteTag"("tagId");
```

## Security Features

### Row Level Security (RLS)
All tables now have RLS enabled with policies that ensure:
- Users can only access their own notes
- Users can only access their own tags
- Users can only manage note-tag relationships for their own notes

### Cascade Deletes
When a user is deleted, all their related data (notes, tags, note-tag relationships) are automatically deleted to maintain data consistency.

## Support

If you encounter issues during migration:

1. **Check Supabase Logs**: Go to Supabase Dashboard → Logs
2. **Verify Schema**: Use the verification queries above
3. **Check Application Logs**: Look at your application console for any Prisma errors
4. **Test API Endpoints**: Use tools like Postman to test your API routes

## Migration Checklist

- [ ] Backup existing data
- [ ] Choose migration option (fresh vs update)
- [ ] Run migration script in Supabase SQL Editor
- [ ] Handle existing tags (if using update option)
- [ ] Verify table structure and constraints
- [ ] Check RLS policies are active
- [ ] Update local Prisma client (`pnpm dlx prisma generate`)
- [ ] Test application functionality
- [ ] Verify toast notifications are working
- [ ] Test note creation, editing, and deletion
- [ ] Test tag management
- [ ] Deploy to production environment

## Success Indicators

You'll know the migration was successful when:
- ✅ All tables exist with correct structure
- ✅ Foreign key constraints are properly set
- ✅ RLS policies are active and working
- ✅ Application can create/edit/delete notes
- ✅ Tag management works correctly
- ✅ Toast notifications appear for all actions
- ✅ No console errors in the browser or server logs

---

**Important**: Always test the migration on a development/staging environment before applying to production!
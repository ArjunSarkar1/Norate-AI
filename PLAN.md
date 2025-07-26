# 📘 AI Note-Taking App – Full Stack Plan

This is a full technical plan for building a modern AI-powered note-taking web application using:

- **Next.js (App Router)**
- **Supabase (Auth + Database)**
- **Prisma (ORM)**
- **Vercel (Deployment)**
- **Shadcn/UI + Tailwind CSS**
- **OpenAI / pgvector (AI features)**

---

## 🧽 Project Goals

Create an intelligent note-taking app that goes beyond simple text capture by offering:

- Rich text editing with smart AI assistance
- Summarization and auto-titling
- Semantic search
- Daily note recaps
- A clean, responsive UI
- Real-time collaboration-ready backend

---

## 🧱 Stack Overview

| Layer         | Tech Choice                         |
| ------------- | ----------------------------------- |
| Frontend      | Next.js (App Router) + Shadcn/UI    |
| Auth          | Supabase Auth                       |
| DB            | Supabase Postgres (via Prisma ORM)  |
| Vector Search | Supabase + pgvector                 |
| AI Services   | OpenAI API (GPT & Embeddings)       |
| Hosting       | Vercel (Edge functions + Cron Jobs) |
| Editor        | TipTap or Novel.sh editor           |

---

## 🗂️ File & Folder Structure (Simplified)

```
app/
  layout.tsx
  page.tsx
  notes/
    page.tsx
    [id]/page.tsx
    new/page.tsx
  api/
    ai/
      summarize/route.ts
      title/route.ts
      embed/route.ts
      query/route.ts
components/
  editor/
  ui/
lib/
  prisma.ts
  supabase.ts
  embeddings.ts
  prompts.ts
prisma/
  schema.prisma
plan.md
.env
```

---

## 🛠️ Database Schema (Prisma + Supabase)

```ts
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  notes     Note[]
  createdAt DateTime @default(now())
}

model Note {
  id         String   @id @default(cuid())
  title      String?
  content    Json
  summary    String?
  embedding  Float[]  @db.Vector(1536) // pgvector extension
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  tags       Tag[]    @relation("NoteTags")
}

model Tag {
  id    String  @id @default(cuid())
  name  String
  notes Note[]  @relation("NoteTags")
}
```

---

## 🔐 Auth Flow

- Use Supabase's built-in **OAuth + Email/Password**
- After login, create/check user in your `User` table
- Use Supabase session in frontend (`@supabase/auth-helpers-nextjs`)
- Guard all note API routes with session validation

---

## ✍️ Rich Text Editor

Use [Tiptap](https://tiptap.dev/) or [Novel.sh](https://github.com/steven-tey/novel) for the editor:

- JSON-based content for structured storage
- Extensions: heading, lists, code blocks, slash commands
- Store as `content: Json` in Prisma

---

## 🧠 AI Features

### 1. Summarization

**Route**: `POST /api/ai/summarize`\
**Inputs**: note content\
**Outputs**: summary string\
**Prompt**:

```txt
Summarize the following note into 2-3 sentences. Keep it informative and concise.

[CONTENT]
```

### 2. Auto Title

**Route**: `POST /api/ai/title`\
**Input**: note content\
**Output**: string title\
**Prompt**:

```txt
Generate a short, clear title (under 10 words) for this note.

[CONTENT]
```

### 3. Embedding Notes

**Route**: `POST /api/ai/embed`\
**Input**: note content\
**Action**: Fetch OpenAI embedding → Store in `Note.embedding`

### 4. Semantic Search

**Route**: `POST /api/ai/query`\
**Input**: natural language question\
**Action**:

- Generate embedding for question
- Search via Supabase `pgvector`
- Return most similar notes (cosine similarity)

### 5. Daily Recap (Vercel Cron Job)

- Run job daily via `vercel.json`
- Fetch user notes from last 24h
- Summarize them and optionally email or show in dashboard

---

## 📄 API Routes (App Router)

| Route                    | Purpose                     |
| ------------------------ | --------------------------- |
| `POST /api/ai/summarize` | Generate summary for a note |
| `POST /api/ai/title`     | Suggest title               |
| `POST /api/ai/embed`     | Embed note content          |
| `POST /api/ai/query`     | Semantic search             |
| `GET /api/notes`         | Get all notes for user      |
| `POST /api/notes`        | Create note                 |
| `PUT /api/notes/:id`     | Update note                 |
| `DELETE /api/notes/:id`  | Delete note                 |

---

## 🧹 Frontend Component Plan

| Component        | Purpose                     |
| ---------------- | --------------------------- |
| `<NoteEditor />` | TipTap editor with toolbar  |
| `<NoteCard />`   | Summary view of note        |
| `<NoteList />`   | All notes with filters/tags |
| `<AIRecap />`    | Daily recap section         |
| `<AISearch />`   | Semantic search box         |
| `<Sidebar />`    | Navigation + tags           |
| `<TagInput />`   | Create/select tags for note |

---

## ✅ MVP Feature List

-

---

## 🔒 Security

- Supabase RLS: `user_id = auth.uid()`
- Validate session in API handlers
- Sanitize content before calling LLMs

---

## 📦 Deployment & DevOps

- **Vercel**: Deploy frontend + API
- **Database**: Supabase project (enable `pgvector`)
- **Cron Job**: Vercel scheduled functions
- **Env Vars**:
  ```env
  OPENAI_API_KEY=
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```

---

## 🚀 Stretch Goals

-


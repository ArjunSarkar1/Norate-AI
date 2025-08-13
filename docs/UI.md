# 🖥️ User Interface Plan – AI Note-Taking App

## Main UI Areas

1. **Auth Pages**
   - Login, Signup, Forgot Password
2. **Dashboard (after login)**
   - **Sidebar:** Navigation, tag filter, new note button
   - **Main Area:**
     - **Note List:** Cards for each note, with title, summary, tags
     - **Note Editor:** Rich text editor (Tiptap/Novel.sh), AI assist buttons (summarize, auto-title)
     - **AI Recap:** Daily summary section
     - **Semantic Search:** Search bar with AI-powered results
3. **Note Details**
   - Full note view/edit, tags, AI actions
4. **Tag Management**
   - Add, edit, filter by tags
5. **Settings/Profile**
   - User info, logout, theme toggle

---

## UI Component Plan

| Component         | Description                                      |
|-------------------|--------------------------------------------------|
| Header            | App logo, user menu, theme toggle                |
| Sidebar           | Navigation, tags, new note button                |
| NoteList          | List of NoteCard components                      |
| NoteCard          | Summary view: title, summary, tags, actions      |
| NoteEditor        | Rich text editor, AI assist buttons              |
| TagInput          | Add/select tags for a note                       |
| AIRecap           | Daily recap, recent AI summaries                 |
| AISearch          | Semantic search bar, results                     |
| AuthPages         | Login, Signup, Forgot Password                   |
| Settings/Profile  | User info, logout, preferences                   |

---

## Next Steps

1. **UI Scaffolding:**
   - Build the dashboard layout: sidebar + main area.
   - Add placeholder components for NoteList, NoteEditor, AIRecap, AISearch.
   - Implement navigation and route structure as per PLAN.md.
2. **Editor Integration:**
   - Integrate Tiptap or Novel.sh for rich text editing.
3. **API Endpoints:**
   - Scaffold `/api/notes` and `/api/ai/*` endpoints.
4. **AI Features:**
   - Integrate OpenAI for summarization, titling, embeddings.
5. **Semantic Search:**
   - Set up pgvector in Supabase, implement embedding and search.
6. **Polish Auth & User Flows:**
   - Improve user onboarding, error handling, and profile management. 
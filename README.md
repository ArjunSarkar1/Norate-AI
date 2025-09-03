# Norate AI - Intelligent Note-Taking Application

A modern, AI-powered note-taking application built with Next.js, featuring automatic summarization, semantic search, smart title generation, and advanced export capabilities.

## ✨ Features

### 🤖 AI-Powered Features
- **Automatic Summarization**: Generate concise summaries of your notes using GPT-3.5-turbo
- **Semantic Search**: Find notes using natural language queries with vector embeddings
- **Auto-Title Generation**: Get intelligent title suggestions based on note content
- **Smart Insights**: AI-powered analytics and note overview dashboard

### 📝 Core Functionality
- **Rich Text Editor**: Powered by TipTap with extensive formatting options
- **Real-time Auto-save**: Never lose your work with automatic saving
- **Tag Management**: Organize notes with custom tags
- **Advanced Search**: Traditional keyword search plus AI semantic search

### 📤 Export & Sharing
- **Multiple Formats**: Export to PDF, Markdown, HTML, JSON, and plain text
- **Batch Export**: Export multiple notes simultaneously
- **Flexible Options**: Include/exclude metadata, tags, and AI summaries

### ⚡ Modern Experience
- **Real-time Sync**: Infrastructure ready for collaborative editing
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Mode**: System-aware theming
- **Keyboard Shortcuts**: Efficient navigation and editing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- PostgreSQL database
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/norate-ai.git
   cd norate-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/norate_db"
   
   # OpenAI (Required for AI features)
   OPENAI_API_KEY=your_openai_api_key
   
   # Pusher (Optional - for real-time features)
   PUSHER_APP_ID=your_pusher_app_id
   NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
   PUSHER_SECRET=your_pusher_secret
   NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
   ```

4. **Set up the database**
   ```bash
   npm run migrate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **UI Components**: Radix UI primitives
- **Editor**: TipTap rich text editor
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **AI Services**: OpenAI GPT-3.5-turbo & text-embedding-ada-002
- **Real-time**: Pusher (optional)

### Database Schema
```sql
-- Core tables
User (id, email, createdAt, updatedAt)
Note (id, title, content, summary, embedding, userId, createdAt, updatedAt)
Tag (id, name, userId, createdAt, updatedAt)
NoteTag (id, noteId, tagId) -- Many-to-many relationship
```

### AI Integration
- **Embeddings**: 1536-dimension vectors stored as `Float[]`
- **Summarization**: Content analysis with GPT-3.5-turbo
- **Search**: Cosine similarity matching on embeddings
- **Auto-processing**: New notes automatically get embeddings generated

## 📖 Usage Guide

### Getting Started
1. **Sign up** for an account using your email
2. **Create your first note** using the rich text editor
3. **Add tags** to organize your content
4. **Enable AI features** by ensuring OpenAI API key is configured

### AI Features

#### 📊 AI Recap
- View intelligent summaries of your recent notes
- Track AI processing status and coverage
- Get insights into your note-taking patterns

#### 🔍 Semantic Search
- Search using natural language: "meeting notes about project timeline"
- Adjust similarity thresholds for broader/narrower results
- Process existing notes for searchability

#### 🏷️ Auto-Title Generation
- Get AI-suggested titles based on note content
- Choose from multiple creative options
- Apply titles directly or use as inspiration

#### 📤 Smart Export
- Export with AI summaries included
- Filter notes by date, tags, or AI processing status
- Multiple format support with consistent styling

### Keyboard Shortcuts
- `Ctrl/Cmd + S` - Manual save
- `Ctrl/Cmd + N` - New note
- `Ctrl/Cmd + K` - Quick search (coming soon)

## 🔧 Configuration

### OpenAI Setup
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your `.env.local` file
3. Monitor usage in OpenAI dashboard

### Supabase Setup
1. Create a new project at [Supabase](https://supabase.com)
2. Get your project URL and keys
3. Configure authentication providers as needed

### Pusher Setup (Optional)
1. Create account at [Pusher](https://pusher.com)
2. Create new app and get credentials
3. Add to environment variables for real-time features

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker
```bash
# Build image
docker build -t norate-ai .

# Run container
docker run -p 3000:3000 --env-file .env.local norate-ai
```

### Environment Variables for Production
- Set all required environment variables
- Use strong secrets for authentication
- Configure proper database URLs
- Set up monitoring and error tracking

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Conventional commits for clear history
- Component-based architecture

### Adding AI Features
1. Extend `/lib/ai-service.ts` for new AI capabilities
2. Create API endpoints in `/app/api/ai/`
3. Add UI components in `/components/`
4. Update database schema if needed

## 📊 Performance

### Optimization Features
- Vector embeddings for fast semantic search
- Automatic caching of AI-generated content
- Debounced auto-save to prevent excessive API calls
- Efficient pagination for large datasets

### Monitoring
- Built-in error boundaries
- API response time tracking
- OpenAI usage monitoring
- Database query optimization

## 🔐 Security

### Data Protection
- User data isolation (users can't access others' notes)
- Encrypted connections (HTTPS/WSS)
- Secure authentication with Supabase
- API key protection and rate limiting

### Privacy
- AI processing is stateless (no data stored by OpenAI)
- User content never leaves secure infrastructure
- Optional real-time features with proper authentication

## 🐛 Troubleshooting

### Common Issues

**AI features not working**
- Verify OpenAI API key is set correctly
- Check API key has sufficient credits
- Ensure notes have content (minimum 10 characters)

**Search returns no results**
- Run embedding generation: AI Recap → Process All
- Wait for processing to complete
- Try different search terms or lower similarity threshold

**Real-time features not working**
- Check Pusher credentials
- Verify network allows WebSocket connections
- Check browser console for connection errors

### Getting Help
- Check the [Issues](https://github.com/your-username/norate-ai/issues) page
- Join our [Discord community](https://discord.gg/your-invite)
- Read the [Documentation](https://docs.norate-ai.com)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TipTap](https://tiptap.dev/) for the excellent rich text editor
- [OpenAI](https://openai.com/) for powerful AI capabilities
- [Supabase](https://supabase.com/) for backend infrastructure
- [Vercel](https://vercel.com/) for deployment platform
- [Radix UI](https://www.radix-ui.com/) for accessible components

---

Built with ❤️ for the future of intelligent note-taking.

For more information, visit [https://norate-ai.com](https://norate-ai.com)
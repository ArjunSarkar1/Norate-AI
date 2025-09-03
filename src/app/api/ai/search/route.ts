import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding, semanticSearch } from '@/lib/ai-service';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { query, threshold = 0.7, limit = 20 } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Get all user's notes with embeddings
    const { data: notes, error: notesError } = await supabase
      .from('Note')
      .select('id, title, content, summary, embedding, createdAt, updatedAt')
      .eq('userId', user.id)
      .not('embedding', 'is', null)
      .order('updatedAt', { ascending: false });

    if (notesError) {
      console.error('Error fetching notes:', notesError);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    if (!notes || notes.length === 0) {
      return NextResponse.json({
        results: [],
        query,
        message: 'No notes found with embeddings. Please ensure your notes are processed for semantic search.',
      });
    }

    // Prepare notes for semantic search
    const noteEmbeddings = notes
      .filter(note => note.embedding && Array.isArray(note.embedding) && note.embedding.length > 0)
      .map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        summary: note.summary,
        embedding: note.embedding as number[],
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }));

    if (noteEmbeddings.length === 0) {
      return NextResponse.json({
        results: [],
        query,
        message: 'No notes have valid embeddings for semantic search.',
      });
    }

    // Perform semantic search
    const searchResults = await semanticSearch(query, noteEmbeddings, threshold);

    // Limit results
    const limitedResults = searchResults.slice(0, limit);

    // Enrich results with full note data
    const enrichedResults = limitedResults.map(result => {
      const note = notes.find(n => n.id === result.id);
      return {
        id: result.id,
        title: result.title || note?.title,
        summary: note?.summary,
        similarity: result.similarity,
        createdAt: note?.createdAt,
        updatedAt: note?.updatedAt,
      };
    });

    return NextResponse.json({
      results: enrichedResults,
      query,
      threshold,
      totalFound: searchResults.length,
      totalNotes: noteEmbeddings.length,
      message: `Found ${enrichedResults.length} relevant notes`,
    });

  } catch (error) {
    console.error('Error in semantic search endpoint:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable' },
          { status: 503 }
        );
      }

      if (error.message.includes('dimensions')) {
        return NextResponse.json(
          { error: 'Embedding format mismatch. Please regenerate embeddings.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to perform semantic search. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const threshold = parseFloat(searchParams.get('threshold') || '0.7');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    // Get all user's notes with embeddings
    const { data: notes, error: notesError } = await supabase
      .from('Note')
      .select('id, title, content, summary, embedding, createdAt, updatedAt')
      .eq('userId', user.id)
      .not('embedding', 'is', null)
      .order('updatedAt', { ascending: false });

    if (notesError) {
      console.error('Error fetching notes:', notesError);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    if (!notes || notes.length === 0) {
      return NextResponse.json({
        results: [],
        query,
        message: 'No notes found with embeddings.',
      });
    }

    // Prepare notes for semantic search
    const noteEmbeddings = notes
      .filter(note => note.embedding && Array.isArray(note.embedding) && note.embedding.length > 0)
      .map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        summary: note.summary,
        embedding: note.embedding as number[],
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }));

    if (noteEmbeddings.length === 0) {
      return NextResponse.json({
        results: [],
        query,
        message: 'No notes have valid embeddings for semantic search.',
      });
    }

    // Perform semantic search
    const searchResults = await semanticSearch(query, noteEmbeddings, threshold);

    // Limit results
    const limitedResults = searchResults.slice(0, limit);

    // Enrich results with full note data
    const enrichedResults = limitedResults.map(result => {
      const note = notes.find(n => n.id === result.id);
      return {
        id: result.id,
        title: result.title || note?.title,
        summary: note?.summary,
        similarity: result.similarity,
        createdAt: note?.createdAt,
        updatedAt: note?.updatedAt,
      };
    });

    return NextResponse.json({
      results: enrichedResults,
      query,
      threshold,
      totalFound: searchResults.length,
      totalNotes: noteEmbeddings.length,
      message: `Found ${enrichedResults.length} relevant notes`,
    });

  } catch (error) {
    console.error('Error in semantic search endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to perform semantic search. Please try again.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding, extractTextFromTipTapContent } from '@/lib/ai-service';

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
    const { noteId, content, title, batchProcess = false } = body;

    if (batchProcess) {
      // Process all user's notes that don't have embeddings
      const { data: notes, error: notesError } = await supabase
        .from('Note')
        .select('id, title, content')
        .eq('userId', user.id)
        .is('embedding', null)
        .order('updatedAt', { ascending: false });

      if (notesError) {
        console.error('Error fetching notes for batch processing:', notesError);
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
      }

      if (!notes || notes.length === 0) {
        return NextResponse.json({
          message: 'All notes already have embeddings',
          processed: 0,
          errors: 0,
        });
      }

      const results = {
        processed: 0,
        errors: 0,
        errorDetails: [] as string[],
      };

      // Process notes in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < notes.length; i += batchSize) {
        const batch = notes.slice(i, i + batchSize);

        await Promise.all(batch.map(async (note) => {
          try {
            const text = extractTextFromTipTapContent(note.content);
            const fullText = `${note.title || ''} ${text}`.trim();

            if (fullText.length < 10) {
              results.errors++;
              results.errorDetails.push(`Note ${note.id}: Content too short`);
              return;
            }

            const embeddingResult = await generateEmbedding(fullText);

            const { error: updateError } = await supabase
              .from('Note')
              .update({ embedding: embeddingResult.embedding })
              .eq('id', note.id)
              .eq('userId', user.id);

            if (updateError) {
              results.errors++;
              results.errorDetails.push(`Note ${note.id}: Database update failed`);
            } else {
              results.processed++;
            }

            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            results.errors++;
            results.errorDetails.push(`Note ${note.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }));

        // Longer delay between batches
        if (i + batchSize < notes.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return NextResponse.json({
        message: `Batch processing completed. Processed ${results.processed} notes with ${results.errors} errors.`,
        processed: results.processed,
        errors: results.errors,
        errorDetails: results.errorDetails,
      });
    }

    // Single note processing
    if (!noteId && (!content || !title)) {
      return NextResponse.json({
        error: 'Either noteId or both content and title are required'
      }, { status: 400 });
    }

    let noteData;
    let textContent: string;

    if (noteId) {
      // Verify user owns the note and get its content
      const { data: note, error: noteError } = await supabase
        .from('Note')
        .select('id, title, content, userId')
        .eq('id', noteId)
        .single();

      if (noteError || !note || note.userId !== user.id) {
        return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
      }

      noteData = note;
      const text = extractTextFromTipTapContent(note.content);
      textContent = `${note.title || ''} ${text}`.trim();
    } else {
      // Use provided content
      const text = extractTextFromTipTapContent(content);
      textContent = `${title || ''} ${text}`.trim();
    }

    if (textContent.length < 10) {
      return NextResponse.json({
        error: 'Content is too short for embedding generation'
      }, { status: 400 });
    }

    // Generate embedding
    const embeddingResult = await generateEmbedding(textContent);

    // If noteId is provided, update the note with the embedding
    if (noteId && noteData) {
      const { error: updateError } = await supabase
        .from('Note')
        .update({ embedding: embeddingResult.embedding })
        .eq('id', noteId)
        .eq('userId', user.id);

      if (updateError) {
        console.error('Error updating note embedding:', updateError);
        return NextResponse.json({
          error: 'Failed to save embedding to note'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      embedding: embeddingResult.embedding,
      tokens: embeddingResult.tokens,
      dimensions: embeddingResult.embedding.length,
      saved: !!noteId,
      message: noteId ? 'Embedding generated and saved to note' : 'Embedding generated successfully',
    });

  } catch (error) {
    console.error('Error in embeddings endpoint:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable' },
          { status: 503 }
        );
      }

      if (error.message.includes('too short')) {
        return NextResponse.json(
          { error: 'Content is too short for embedding generation' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate embedding. Please try again.' },
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

    // Get statistics about embeddings
    const { data: stats, error: statsError } = await supabase
      .from('Note')
      .select('id, embedding')
      .eq('userId', user.id);

    if (statsError) {
      console.error('Error fetching embedding stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }

    const totalNotes = stats?.length || 0;
    const notesWithEmbeddings = stats?.filter(note =>
      note.embedding && Array.isArray(note.embedding) && note.embedding.length > 0
    ).length || 0;
    const notesWithoutEmbeddings = totalNotes - notesWithEmbeddings;

    return NextResponse.json({
      totalNotes,
      notesWithEmbeddings,
      notesWithoutEmbeddings,
      embeddingCoverage: totalNotes > 0 ? (notesWithEmbeddings / totalNotes * 100).toFixed(1) + '%' : '0%',
      message: 'Embedding statistics retrieved successfully',
    });

  } catch (error) {
    console.error('Error retrieving embedding statistics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve statistics. Please try again.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAutoTitle } from '@/lib/ai-service';

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
    const { noteId, content, applyTitle } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // If noteId is provided, verify user owns the note
    if (noteId) {
      const { data: note, error: noteError } = await supabase
        .from('Note')
        .select('userId, title')
        .eq('id', noteId)
        .single();

      if (noteError || !note || note.userId !== user.id) {
        return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
      }
    }

    // Generate title suggestions using AI service
    const titleResult = await generateAutoTitle(content);

    // If applyTitle is true and noteId is provided, update the note
    if (applyTitle && noteId && titleResult.recommended) {
      const { error: updateError } = await supabase
        .from('Note')
        .update({ title: titleResult.recommended })
        .eq('id', noteId)
        .eq('userId', user.id);

      if (updateError) {
        console.error('Error updating note title:', updateError);
        return NextResponse.json(
          { error: 'Failed to apply title to note' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      suggestions: titleResult.suggestions,
      recommended: titleResult.recommended,
      confidence: titleResult.confidence,
      applied: applyTitle && noteId ? titleResult.recommended : null,
      message: applyTitle && noteId ? 'Title applied successfully' : 'Title suggestions generated',
    });

  } catch (error) {
    console.error('Error in auto-title endpoint:', error);

    if (error instanceof Error) {
      if (error.message.includes('too short')) {
        return NextResponse.json(
          { error: 'Content is too short for title generation. Please add more content.' },
          { status: 400 }
        );
      }

      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate title suggestions. Please try again.' },
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
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Get the note and verify ownership
    const { data: note, error: noteError } = await supabase
      .from('Note')
      .select('id, title, content, userId')
      .eq('id', noteId)
      .eq('userId', user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Generate title suggestions
    const titleResult = await generateAutoTitle(note.content);

    return NextResponse.json({
      suggestions: titleResult.suggestions,
      recommended: titleResult.recommended,
      confidence: titleResult.confidence,
      currentTitle: note.title,
      message: 'Title suggestions generated successfully',
    });

  } catch (error) {
    console.error('Error generating title suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate title suggestions. Please try again.' },
      { status: 500 }
    );
  }
}

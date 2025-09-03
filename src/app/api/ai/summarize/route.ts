import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSummary } from '@/lib/ai-service';

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
    const { noteId, content, title } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // If noteId is provided, verify user owns the note
    if (noteId) {
      const { data: note, error: noteError } = await supabase
        .from('Note')
        .select('userId')
        .eq('id', noteId)
        .single();

      if (noteError || !note || note.userId !== user.id) {
        return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
      }
    }

    // Generate summary using AI service
    const summaryResult = await generateSummary(content, title);

    // If noteId is provided, update the note with the summary
    if (noteId) {
      const { error: updateError } = await supabase
        .from('Note')
        .update({ summary: summaryResult.summary })
        .eq('id', noteId)
        .eq('userId', user.id);

      if (updateError) {
        console.error('Error updating note summary:', updateError);
        // Don't fail the request if update fails, just log the error
      }
    }

    return NextResponse.json({
      summary: summaryResult.summary,
      keyPoints: summaryResult.keyPoints,
      confidence: summaryResult.confidence,
      message: 'Summary generated successfully',
    });

  } catch (error) {
    console.error('Error in summarization endpoint:', error);

    if (error instanceof Error) {
      if (error.message.includes('too short')) {
        return NextResponse.json(
          { error: 'Content is too short for summarization. Please add more content.' },
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
      { error: 'Failed to generate summary. Please try again.' },
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
      .select('id, title, content, summary, userId')
      .eq('id', noteId)
      .eq('userId', user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // If note already has a summary, return it
    if (note.summary) {
      return NextResponse.json({
        summary: note.summary,
        keyPoints: [],
        confidence: 1.0,
        cached: true,
        message: 'Retrieved cached summary',
      });
    }

    // Generate new summary
    const summaryResult = await generateSummary(note.content, note.title);

    // Update the note with the new summary
    const { error: updateError } = await supabase
      .from('Note')
      .update({ summary: summaryResult.summary })
      .eq('id', noteId)
      .eq('userId', user.id);

    if (updateError) {
      console.error('Error saving summary to note:', updateError);
    }

    return NextResponse.json({
      summary: summaryResult.summary,
      keyPoints: summaryResult.keyPoints,
      confidence: summaryResult.confidence,
      cached: false,
      message: 'Summary generated and saved successfully',
    });

  } catch (error) {
    console.error('Error retrieving/generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to get summary. Please try again.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Pusher from 'pusher';

// Initialize Pusher server
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

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
    const { channel, event, data } = body;

    if (!channel || !event || !data) {
      return NextResponse.json({
        error: 'Missing required fields: channel, event, data'
      }, { status: 400 });
    }

    // Validate channel access
    if (channel.startsWith('private-note-')) {
      const noteId = channel.replace('private-note-', '');

      // Verify user owns the note
      const { data: note, error: noteError } = await supabase
        .from('Note')
        .select('userId')
        .eq('id', noteId)
        .single();

      if (noteError || !note || note.userId !== user.id) {
        return NextResponse.json({ error: 'Access denied to this channel' }, { status: 403 });
      }
    }

    // Validate that the data contains the user ID and it matches the authenticated user
    if (data.userId && data.userId !== user.id) {
      return NextResponse.json({
        error: 'User ID mismatch'
      }, { status: 403 });
    }

    // Add user ID to data if not present
    const broadcastData = {
      ...data,
      userId: user.id,
      timestamp: data.timestamp || Date.now(),
    };

    // Broadcast the event
    await pusher.trigger(channel, event, broadcastData);

    return NextResponse.json({
      success: true,
      message: 'Event broadcasted successfully',
      channel,
      event,
    });

  } catch (error) {
    console.error('Error broadcasting event:', error);

    // Handle specific Pusher errors
    if (error instanceof Error) {
      if (error.message.includes('channel')) {
        return NextResponse.json(
          { error: 'Invalid channel name' },
          { status: 400 }
        );
      }

      if (error.message.includes('event')) {
        return NextResponse.json(
          { error: 'Invalid event name' },
          { status: 400 }
        );
      }

      if (error.message.includes('data too large')) {
        return NextResponse.json(
          { error: 'Event data too large' },
          { status: 413 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to broadcast event' },
      { status: 500 }
    );
  }
}

// GET endpoint to check channel status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    if (!channel) {
      return NextResponse.json({ error: 'Channel parameter required' }, { status: 400 });
    }

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

    // Validate channel access
    if (channel.startsWith('private-note-')) {
      const noteId = channel.replace('private-note-', '');

      const { data: note, error: noteError } = await supabase
        .from('Note')
        .select('userId')
        .eq('id', noteId)
        .single();

      if (noteError || !note || note.userId !== user.id) {
        return NextResponse.json({ error: 'Access denied to this channel' }, { status: 403 });
      }
    }

    try {
      // Get channel information
      const channelInfo = await pusher.get({
        path: `/channels/${channel}`,
        params: {
          info: 'user_count,subscription_count'
        }
      });

      return NextResponse.json({
        channel,
        occupied: channelInfo.body.occupied || false,
        userCount: channelInfo.body.user_count || 0,
        subscriptionCount: channelInfo.body.subscription_count || 0,
      });
    } catch (pusherError) {
      // Channel might not exist yet, that's okay
      return NextResponse.json({
        channel,
        occupied: false,
        userCount: 0,
        subscriptionCount: 0,
      });
    }

  } catch (error) {
    console.error('Error getting channel info:', error);
    return NextResponse.json(
      { error: 'Failed to get channel information' },
      { status: 500 }
    );
  }
}

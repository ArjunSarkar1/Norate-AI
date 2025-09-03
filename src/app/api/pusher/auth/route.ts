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

    const body = await request.text();
    const params = new URLSearchParams(body);

    const socketId = params.get('socket_id');
    const channelName = params.get('channel_name');

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 });
    }

    // Check if user has access to this channel
    if (channelName.startsWith('private-note-')) {
      const noteId = channelName.replace('private-note-', '');

      // Verify user owns the note
      const { data: note, error: noteError } = await supabase
        .from('Note')
        .select('userId')
        .eq('id', noteId)
        .single();

      if (noteError || !note || note.userId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Create presence data for the user
    const presenceData = {
      user_id: user.id,
      user_info: {
        id: user.id,
        name: user.email || 'Anonymous',
        email: user.email,
      },
    };

    // Authenticate the user for the channel
    const authResponse = pusher.authorizeChannel(socketId, channelName, presenceData);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Error authenticating Pusher channel:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

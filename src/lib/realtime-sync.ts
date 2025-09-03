import Pusher from 'pusher-js';

// Types for real-time events
export interface RealtimeEvent {
  type: 'note_updated' | 'note_created' | 'note_deleted' | 'user_typing' | 'user_stopped_typing';
  data: any;
  userId: string;
  timestamp: number;
}

export interface NoteUpdateEvent {
  noteId: string;
  title?: string;
  content?: any;
  userId: string;
  userName?: string;
  timestamp: number;
}

export interface TypingEvent {
  noteId: string;
  userId: string;
  userName?: string;
  isTyping: boolean;
  timestamp: number;
}

export interface CollaboratorInfo {
  userId: string;
  userName?: string;
  isTyping: boolean;
  lastSeen: number;
  cursor?: {
    position: number;
    selection?: { from: number; to: number };
  };
}

class RealtimeSyncService {
  private pusher: Pusher | null = null;
  private channel: any = null;
  private userId: string | null = null;
  private userName: string | null = null;
  private currentNoteId: string | null = null;
  private collaborators: Map<string, CollaboratorInfo> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private typingTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // Initialize Pusher connection
  async initialize(userId: string, userName?: string) {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      console.warn('Pusher credentials not found. Real-time sync disabled.');
      return false;
    }

    try {
      this.userId = userId;
      this.userName = userName || 'Anonymous';

      this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        encrypted: true,
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            authorization: `Bearer ${this.getAuthToken()}`,
          },
        },
      });

      this.pusher.connection.bind('connected', () => {
        console.log('Real-time sync connected');
        this.emit('connected', { userId: this.userId });
      });

      this.pusher.connection.bind('disconnected', () => {
        console.log('Real-time sync disconnected');
        this.emit('disconnected', { userId: this.userId });
      });

      this.pusher.connection.bind('error', (error: any) => {
        console.error('Real-time sync error:', error);
        this.emit('error', error);
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize real-time sync:', error);
      return false;
    }
  }

  // Subscribe to a note for real-time collaboration
  async subscribeToNote(noteId: string): Promise<boolean> {
    if (!this.pusher || !this.userId) {
      console.warn('Real-time sync not initialized');
      return false;
    }

    try {
      // Unsubscribe from current note if any
      if (this.currentNoteId && this.channel) {
        this.unsubscribeFromNote();
      }

      this.currentNoteId = noteId;
      const channelName = `private-note-${noteId}`;

      this.channel = this.pusher.subscribe(channelName);

      this.channel.bind('pusher:subscription_succeeded', () => {
        console.log(`Subscribed to note ${noteId}`);
        this.startHeartbeat();
        this.emit('subscribed', { noteId });
      });

      this.channel.bind('pusher:subscription_error', (error: any) => {
        console.error(`Failed to subscribe to note ${noteId}:`, error);
        this.emit('subscription_error', { noteId, error });
      });

      // Bind to note update events
      this.channel.bind('note-updated', (data: NoteUpdateEvent) => {
        if (data.userId !== this.userId) {
          this.emit('note_updated', data);
        }
      });

      // Bind to typing events
      this.channel.bind('user-typing', (data: TypingEvent) => {
        if (data.userId !== this.userId) {
          this.updateCollaboratorTyping(data.userId, data.userName, true);
          this.emit('user_typing', data);
        }
      });

      this.channel.bind('user-stopped-typing', (data: TypingEvent) => {
        if (data.userId !== this.userId) {
          this.updateCollaboratorTyping(data.userId, data.userName, false);
          this.emit('user_stopped_typing', data);
        }
      });

      // Bind to presence events (who's online)
      this.channel.bind('pusher:member_added', (member: any) => {
        if (member.id !== this.userId) {
          this.addCollaborator(member.id, member.info?.name);
          this.emit('collaborator_joined', {
            userId: member.id,
            userName: member.info?.name,
          });
        }
      });

      this.channel.bind('pusher:member_removed', (member: any) => {
        this.removeCollaborator(member.id);
        this.emit('collaborator_left', {
          userId: member.id,
          userName: member.info?.name,
        });
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to note:', error);
      return false;
    }
  }

  // Unsubscribe from current note
  unsubscribeFromNote() {
    if (this.channel && this.currentNoteId) {
      this.pusher?.unsubscribe(`private-note-${this.currentNoteId}`);
      this.channel = null;
      this.currentNoteId = null;
      this.collaborators.clear();
      this.stopHeartbeat();
      this.emit('unsubscribed', {});
    }
  }

  // Broadcast note update
  async broadcastNoteUpdate(noteId: string, title?: string, content?: any) {
    if (!this.channel || !this.userId || noteId !== this.currentNoteId) {
      return false;
    }

    try {
      const updateData: NoteUpdateEvent = {
        noteId,
        title,
        content,
        userId: this.userId,
        userName: this.userName || undefined,
        timestamp: Date.now(),
      };

      // Send to backend API which will broadcast via Pusher
      const response = await fetch('/api/pusher/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          channel: `private-note-${noteId}`,
          event: 'note-updated',
          data: updateData,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error broadcasting note update:', error);
      return false;
    }
  }

  // Broadcast typing status
  async broadcastTyping(isTyping: boolean) {
    if (!this.channel || !this.userId || !this.currentNoteId) {
      return false;
    }

    try {
      const typingData: TypingEvent = {
        noteId: this.currentNoteId,
        userId: this.userId,
        userName: this.userName || undefined,
        isTyping,
        timestamp: Date.now(),
      };

      const event = isTyping ? 'user-typing' : 'user-stopped-typing';

      const response = await fetch('/api/pusher/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          channel: `private-note-${this.currentNoteId}`,
          event,
          data: typingData,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error broadcasting typing status:', error);
      return false;
    }
  }

  // Handle user typing with debounced stop typing
  handleUserTyping() {
    this.broadcastTyping(true);

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Set timeout to broadcast stop typing
    this.typingTimeout = setTimeout(() => {
      this.broadcastTyping(false);
    }, 2000); // Stop typing after 2 seconds of inactivity
  }

  // Get current collaborators
  getCollaborators(): CollaboratorInfo[] {
    return Array.from(this.collaborators.values());
  }

  // Get collaborators who are currently typing
  getTypingCollaborators(): CollaboratorInfo[] {
    return this.getCollaborators().filter(collaborator => collaborator.isTyping);
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emit event to listeners
  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Private helper methods
  private addCollaborator(userId: string, userName?: string) {
    this.collaborators.set(userId, {
      userId,
      userName,
      isTyping: false,
      lastSeen: Date.now(),
    });
  }

  private removeCollaborator(userId: string) {
    this.collaborators.delete(userId);
  }

  private updateCollaboratorTyping(userId: string, userName?: string, isTyping: boolean) {
    const collaborator = this.collaborators.get(userId);
    if (collaborator) {
      collaborator.isTyping = isTyping;
      collaborator.lastSeen = Date.now();
    } else if (isTyping) {
      // Add new collaborator if they're typing
      this.addCollaborator(userId, userName);
      const newCollaborator = this.collaborators.get(userId);
      if (newCollaborator) {
        newCollaborator.isTyping = true;
      }
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      // Send heartbeat to keep connection alive and update presence
      if (this.channel && this.currentNoteId) {
        this.channel.trigger('client-heartbeat', {
          userId: this.userId,
          timestamp: Date.now(),
        });
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private getAuthToken(): string {
    // Get token from localStorage or wherever you store it
    if (typeof window !== 'undefined') {
      return localStorage.getItem('supabase.auth.token') || '';
    }
    return '';
  }

  // Cleanup
  disconnect() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.stopHeartbeat();
    this.unsubscribeFromNote();

    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }

    this.collaborators.clear();
    this.eventListeners.clear();
    this.userId = null;
    this.userName = null;
  }

  // Connection status
  isConnected(): boolean {
    return this.pusher?.connection.state === 'connected';
  }

  getCurrentNoteId(): string | null {
    return this.currentNoteId;
  }
}

// Export singleton instance
export const realtimeSync = new RealtimeSyncService();

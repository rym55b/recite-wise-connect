import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
};

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  session_id: string | null;
  content: string;
  created_at: string;
  sender_name?: string;
}

interface ChatBoxProps {
  /** For session chat */
  sessionId?: string;
  /** For private messaging */
  receiverId?: string;
  receiverName?: string;
  /** Show as floating panel or inline */
  mode?: 'floating' | 'inline';
}

export function ChatBox({ sessionId, receiverId, receiverName, mode = 'floating' }: ChatBoxProps) {
  const { profile } = useAuth();
  const { t, dir } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [open, setOpen] = useState(mode === 'inline');
  const [unread, setUnread] = useState(0);
  const [peerTyping, setPeerTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable channel name for typing events
  const typingTopic = sessionId
    ? `typing-session-${sessionId}`
    : receiverId && profile
      ? `typing-dm-${[profile.id, receiverId].sort().join('-')}`
      : null;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, []);

  // Fetch messages
  useEffect(() => {
    if (!profile) return;

    const fetchMessages = async () => {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else if (receiverId) {
        query = query.is('session_id', null).or(
          `and(sender_id.eq.${profile.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${profile.id})`
        );
      }

      const { data } = await query;
      if (data) {
        setMessages(data as Message[]);
        scrollToBottom();
      }
    };

    fetchMessages();
  }, [profile, sessionId, receiverId, scrollToBottom]);

  // Realtime subscription
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel(`chat-${sessionId || receiverId || 'global'}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        ...(sessionId ? { filter: `session_id=eq.${sessionId}` } : {}),
      }, (payload) => {
        const msg = payload.new as Message;
        // For private messages, filter relevance
        if (!sessionId && receiverId) {
          const isRelevant =
            (msg.sender_id === profile.id && msg.receiver_id === receiverId) ||
            (msg.sender_id === receiverId && msg.receiver_id === profile.id);
          if (!isRelevant) return;
        }
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
        if (msg.sender_id !== profile.id) {
          playNotificationSound();
          if (!open) setUnread(u => u + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, sessionId, receiverId, open, scrollToBottom]);

  // Typing indicator: broadcast channel
  useEffect(() => {
    if (!profile || !typingTopic) return;

    const channel = supabase.channel(typingTopic, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const fromId = (payload.payload as any)?.userId;
        if (!fromId || fromId === profile.id) return;
        // For DMs, only show if from the active partner
        if (!sessionId && receiverId && fromId !== receiverId) return;
        setPeerTyping(true);
        if (peerTypingTimeoutRef.current) clearTimeout(peerTypingTimeoutRef.current);
        peerTypingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 2500);
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        const fromId = (payload.payload as any)?.userId;
        if (!fromId || fromId === profile.id) return;
        if (!sessionId && receiverId && fromId !== receiverId) return;
        setPeerTyping(false);
        if (peerTypingTimeoutRef.current) clearTimeout(peerTypingTimeoutRef.current);
      })
      .subscribe();

    typingChannelRef.current = channel;

    return () => {
      if (peerTypingTimeoutRef.current) clearTimeout(peerTypingTimeoutRef.current);
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
    };
  }, [profile, typingTopic, sessionId, receiverId]);

  const broadcastTyping = useCallback(() => {
    if (!profile || !typingChannelRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: profile.id },
    });
  }, [profile]);

  const broadcastStopTyping = useCallback(() => {
    if (!profile || !typingChannelRef.current) return;
    lastTypingSentRef.current = 0;
    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: { userId: profile.id },
    });
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMsg(e.target.value);
    if (e.target.value.trim().length > 0) broadcastTyping();
    else broadcastStopTyping();
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !profile) return;

    const msgData: any = {
      sender_id: profile.id,
      content: newMsg.trim(),
    };

    if (sessionId) {
      msgData.session_id = sessionId;
    } else if (receiverId) {
      msgData.receiver_id = receiverId;
    }

    setNewMsg('');
    broadcastStopTyping();
    await supabase.from('messages').insert(msgData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (mode === 'floating') {
    return (
      <>
        {/* Floating button */}
        <AnimatePresence>
          {!open && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="fixed bottom-6 start-6 z-50"
            >
              <Button
                onClick={() => { setOpen(true); setUnread(0); }}
                className="h-14 w-14 rounded-full gradient-emerald border-0 text-primary-foreground shadow-lg relative"
              >
                <MessageSquare className="h-6 w-6" />
                {unread > 0 && (
                  <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                    {unread}
                  </span>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat panel */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-6 start-6 z-50 flex h-[28rem] w-80 flex-col rounded-2xl border border-border/50 bg-background shadow-2xl"
              dir={dir}
            >
              {/* Header */}
              <div className="flex items-center justify-between rounded-t-2xl border-b border-border/50 bg-primary/5 px-4 py-3">
                <h3 className="font-semibold text-foreground text-sm">
                  {receiverName || (sessionId ? 'محادثة الجلسة' : 'الرسائل')}
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground mt-8">لا توجد رسائل بعد</p>
                )}
                {messages.map(msg => {
                  const isMine = msg.sender_id === profile?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-ee-sm'
                          : 'bg-muted text-foreground rounded-es-sm'
                      }`}>
                        <p className="break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {peerTyping && <TypingDots />}
              </div>

              {/* Input */}
              <div className="border-t border-border/50 p-3">
                <div className="flex gap-2">
                  <Input
                    value={newMsg}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالة..."
                    className="flex-1 rounded-full text-sm"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!newMsg.trim()}
                    className="h-9 w-9 rounded-full gradient-emerald border-0 text-primary-foreground"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Inline mode
  return (
    <div className="flex h-full flex-col rounded-xl border border-border/50 bg-background" dir={dir}>
      <div className="border-b border-border/50 px-4 py-3">
        <h3 className="font-semibold text-foreground text-sm">
          {receiverName || 'الرسائل'}
        </h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8">لا توجد رسائل بعد</p>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_id === profile?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                isMine
                  ? 'bg-primary text-primary-foreground rounded-ee-sm'
                  : 'bg-muted text-foreground rounded-es-sm'
              }`}>
                <p className="break-words">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        {peerTyping && <TypingDots />}
      </div>

      <div className="border-t border-border/50 p-3">
        <div className="flex gap-2">
          <Input
            value={newMsg}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالة..."
            className="flex-1 rounded-full text-sm"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!newMsg.trim()}
            className="h-9 w-9 rounded-full gradient-emerald border-0 text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

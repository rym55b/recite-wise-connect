import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowRight, Search } from 'lucide-react';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Navbar } from '@/components/Navbar';
import { ChatBox } from '@/components/ChatBox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function Messages() {
  const { profile } = useAuth();
  const { dir } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('chat');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const loadConversations = async () => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .is('session_id', null)
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (!msgs) return;

      const convMap = new Map<string, { lastMsg: any; unread: number }>();
      for (const msg of msgs) {
        const partnerId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id;
        if (!partnerId) continue;
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, {
            lastMsg: msg,
            unread: (msg.sender_id !== profile.id && !msg.read_at) ? 1 : 0,
          });
        } else {
          const existing = convMap.get(partnerId)!;
          if (msg.sender_id !== profile.id && !msg.read_at) {
            existing.unread++;
          }
        }
      }

      const partnerIds = Array.from(convMap.keys());
      if (partnerIds.length === 0) { setConversations([]); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', partnerIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p.display_name]));

      const convList: Conversation[] = partnerIds.map(pid => {
        const c = convMap.get(pid)!;
        return {
          partnerId: pid,
          partnerName: profileMap.get(pid) || 'مستخدم',
          lastMessage: c.lastMsg.content,
          lastMessageAt: c.lastMsg.created_at,
          unreadCount: c.unread,
        };
      });

      setConversations(convList);
    };

    loadConversations();
  }, [profile]);

  useEffect(() => {
    if (!selectedId || !profile) return;

    const loadPartner = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', selectedId)
        .single();
      if (data) {
        setSelectedPartner({ id: data.id, name: data.display_name });
      }
    };
    loadPartner();
  }, [selectedId, profile]);

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setAllProfiles([]); return; }

    const { data } = await supabase
      .from('profiles')
      .select('id, display_name')
      .neq('id', profile?.id || '')
      .ilike('display_name', `%${query}%`)
      .limit(10);

    setAllProfiles(data || []);
  };

  const selectConversation = (partnerId: string, partnerName: string) => {
    setSelectedPartner({ id: partnerId, name: partnerName });
    setSearchParams({ chat: partnerId });
    setShowSearch(false);
    setSearchQuery('');
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString();
  };

  if (!profile) {
    return (
      <div dir={dir} className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">يرجى تسجيل الدخول</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <MobileBottomNav />
      <main className="container mx-auto px-2 md:px-4 py-2 md:py-6">
        <div className="flex h-[calc(100vh-7.5rem)] md:h-[calc(100vh-8rem)] gap-0 md:gap-4 max-w-5xl mx-auto">
          {/* Conversations list */}
          <div className={`${selectedPartner ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col rounded-xl border border-border/50 bg-background`}>
            <div className="flex items-center justify-between border-b border-border/50 px-3 md:px-4 py-2.5 md:py-3">
              <h2 className="text-base md:text-lg font-bold text-foreground">الرسائل</h2>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            {showSearch && (
              <div className="px-3 py-2 border-b border-border/50">
                <Input
                  value={searchQuery}
                  onChange={e => searchUsers(e.target.value)}
                  placeholder="ابحث عن مستخدم..."
                  className="rounded-full text-sm h-9"
                  autoFocus
                />
                {allProfiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {allProfiles.map(p => (
                      <button
                        key={p.id}
                        onClick={() => selectConversation(p.id, p.display_name)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors active:bg-muted/80"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-bold text-primary">{p.display_name[0]}</span>
                        </div>
                        <span className="text-foreground">{p.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && !showSearch && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <MessageSquare className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">لا توجد محادثات بعد</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">ابحث عن مستخدم لبدء محادثة</p>
                </div>
              )}
              {conversations.map(conv => (
                <button
                  key={conv.partnerId}
                  onClick={() => selectConversation(conv.partnerId, conv.partnerName)}
                  className={`flex w-full items-center gap-3 border-b border-border/30 px-3 md:px-4 py-3 text-start hover:bg-muted/50 active:bg-muted/70 transition-colors ${
                    selectedPartner?.id === conv.partnerId ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg font-bold text-primary">{conv.partnerName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">{conv.partnerName}</span>
                      <span className="text-[10px] text-muted-foreground">{formatTime(conv.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className={`${selectedPartner ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            {selectedPartner ? (
              <>
                <div className="flex items-center gap-2 md:hidden border-b border-border/50 px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8"
                    onClick={() => { setSelectedPartner(null); setSearchParams({}); }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <span className="font-semibold text-foreground text-sm">{selectedPartner.name}</span>
                </div>
                <div className="flex-1">
                  <ChatBox
                    receiverId={selectedPartner.id}
                    receiverName={selectedPartner.name}
                    mode="inline"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">اختر محادثة للبدء</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

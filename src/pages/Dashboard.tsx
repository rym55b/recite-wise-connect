import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Users, ClipboardCheck, Star, Mail, MailOpen, Trophy, LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Navbar } from '@/components/Navbar';
import { IslamicPattern } from '@/components/IslamicPattern';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { t, dir } = useI18n();
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      const [invRes, topRes] = await Promise.all([
        supabase
          .from('invitations')
          .select('*, sender:profiles!invitations_sender_id_fkey(display_name, average_rating), receiver:profiles!invitations_receiver_id_fkey(display_name)')
          .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
          .eq('status', 'pending')
          .limit(5),
        supabase
          .from('profiles')
          .select('id, display_name, average_rating, level, total_sessions')
          .order('average_rating', { ascending: false })
          .limit(5),
      ]);
      setInvitations(invRes.data || []);
      setTopStudents(topRes.data || []);
    };
    fetchData();

    // Realtime invitations
    const channel = supabase
      .channel('dashboard-invitations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invitations' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const handleAcceptInvite = async (id: string) => {
    await supabase.from('invitations').update({ status: 'accepted' }).eq('id', id);
  };

  const handleRejectInvite = async (id: string) => {
    await supabase.from('invitations').update({ status: 'rejected' }).eq('id', id);
  };

  const levelLabel = (l: string) => {
    const map: Record<string, string> = { beginner: t('beginner'), intermediate: t('intermediate'), advanced: t('advanced') };
    return map[l] || l;
  };

  if (loading || !profile) {
    return (
      <div dir={dir} className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const sessionTypes = [
    { icon: BookOpen, title: t('recitation'), desc: t('recitationDesc'), type: 'recitation' },
    { icon: Users, title: t('memorization'), desc: t('memorizationDesc'), type: 'memorization' },
    { icon: ClipboardCheck, title: t('tests'), desc: t('testsDesc'), type: 'test' },
  ];

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl gradient-emerald p-6 text-primary-foreground"
        >
          <IslamicPattern className="text-primary-foreground" opacity={0.08} />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{t('welcomeBack')}، {profile.display_name}</h2>
              <div className="mt-2 flex gap-4 text-primary-foreground/80">
                <span className="flex items-center gap-1"><Star className="h-4 w-4" /> {Number(profile.average_rating).toFixed(1)}</span>
                <span>{profile.total_sessions} {t('sessions')}</span>
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                  {levelLabel(profile.level)}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate('/profile')}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={signOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Session Types */}
        <div>
          <h3 className="mb-4 text-xl font-bold text-foreground">{t('startSession')}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {sessionTypes.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card
                  className="group cursor-pointer border-border/50 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
                  onClick={() => navigate(`/matchmaking?type=${s.type}`)}
                >
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <s.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h4 className="font-bold text-foreground">{s.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Invitations */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-primary" /> {t('invitations')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invitations.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noResults')}</p>
              ) : (
                invitations.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {inv.sender_id === profile.id ? inv.receiver?.display_name : inv.sender?.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{inv.session_type}</p>
                    </div>
                    {inv.receiver_id === profile.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleRejectInvite(inv.id)}>{t('cancel')}</Button>
                        <Button size="sm" className="gradient-emerald border-0 text-primary-foreground" onClick={() => handleAcceptInvite(inv.id)}>قبول</Button>
                      </div>
                    ) : (
                      <Badge variant="secondary">{t('sentInvites')}</Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Top Students */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-gold" /> {t('topStudents')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topStudents.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{s.display_name}</p>
                      <p className="text-xs text-muted-foreground">{levelLabel(s.level)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gold">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-bold">{Number(s.average_rating).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Stats & History link */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/stats')} className="gap-2">
            📊 {t('statistics')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/invitations')} className="gap-2">
            <MailOpen className="h-4 w-4" /> {t('invitations')}
          </Button>
        </div>
      </main>
    </div>
  );
}

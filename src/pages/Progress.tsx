import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Star, Clock, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';

export default function Progress() {
  const { t, dir, lang } = useI18n() as any;
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [sesRes, ratRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('id, session_type, ended_at, started_at, surah_name, from_verse, to_verse, user1_id, user2_id')
          .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
          .eq('status', 'completed')
          .order('ended_at', { ascending: true })
          .limit(500),
        supabase
          .from('ratings')
          .select('stars, created_at, session_id')
          .eq('rated_id', profile.id)
          .order('created_at', { ascending: true })
          .limit(500),
      ]);
      setSessions(sesRes.data || []);
      setRatings(ratRes.data || []);
      setLoading(false);
    })();
  }, [profile]);

  // Rating trend: running average over time
  const trendData = useMemo(() => {
    let sum = 0;
    return ratings.map((r, i) => {
      sum += Number(r.stars);
      return {
        idx: i + 1,
        date: new Date(r.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }),
        avg: Number((sum / (i + 1)).toFixed(2)),
        stars: r.stars,
      };
    });
  }, [ratings, lang]);

  // Per-surah aggregation
  const surahData = useMemo(() => {
    const map: Record<string, { surah: string; verses: number; sessions: number }> = {};
    for (const s of sessions) {
      if (!s.surah_name) continue;
      const verses = s.from_verse && s.to_verse ? Math.max(0, s.to_verse - s.from_verse + 1) : 0;
      const key = s.surah_name;
      if (!map[key]) map[key] = { surah: key, verses: 0, sessions: 0 };
      map[key].verses += verses;
      map[key].sessions += 1;
    }
    return Object.values(map).sort((a, b) => b.verses - a.verses);
  }, [sessions]);

  const totalVerses = surahData.reduce((a, s) => a + s.verses, 0);
  const totalSurahs = surahData.length;
  const totalSessions = sessions.length;
  const avgRating = ratings.length ? (ratings.reduce((a, r) => a + Number(r.stars), 0) / ratings.length) : 0;

  // Goal: 30 surahs as a friendly target
  const surahGoal = 30;
  const surahProgress = Math.min(100, (totalSurahs / surahGoal) * 100);

  if (!profile) return null;

  return (
    <div dir={dir} className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <MobileBottomNav />
      <main className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" /> {t('home')}
        </Button>

        <h2 className="text-2xl font-bold text-foreground">
          {lang === 'ar' ? 'لوحة تتبع التقدم' : 'Progress Tracker'}
        </h2>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Clock className="mx-auto h-5 w-5 text-primary mb-1" />
              <div className="text-xl font-bold text-foreground">{totalSessions}</div>
              <p className="text-xs text-muted-foreground">{t('completedSessions')}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Star className="mx-auto h-5 w-5 text-gold mb-1" />
              <div className="text-xl font-bold text-foreground">{avgRating.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{t('averageRating')}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <BookOpen className="mx-auto h-5 w-5 text-emerald mb-1" />
              <div className="text-xl font-bold text-foreground">{totalSurahs}</div>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'السور' : 'Surahs'}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="mx-auto h-5 w-5 text-primary mb-1" />
              <div className="text-xl font-bold text-foreground">{totalVerses}</div>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'الآيات' : 'Verses'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Surah goal */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">
              {lang === 'ar' ? `هدف السور (${totalSurahs}/${surahGoal})` : `Surahs Goal (${totalSurahs}/${surahGoal})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBar value={surahProgress} className="h-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              {lang === 'ar' ? `أكملت ${surahProgress.toFixed(0)}٪ من الهدف` : `${surahProgress.toFixed(0)}% of goal`}
            </p>
          </CardContent>
        </Card>

        {/* Rating trend */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">
              {lang === 'ar' ? 'تطور التقييم عبر الزمن' : 'Rating Evolution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {lang === 'ar' ? 'لا توجد تقييمات بعد' : 'No ratings yet'}
              </p>
            ) : (
              <div className="h-64" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis domain={[0, 5]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name={lang === 'ar' ? 'المتوسط' : 'Average'} />
                    <Line type="monotone" dataKey="stars" stroke="hsl(var(--gold))" strokeWidth={1} dot={{ r: 2 }} strokeDasharray="4 4" name={lang === 'ar' ? 'التقييم' : 'Rating'} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-Surah breakdown */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">
              {lang === 'ar' ? 'الإنجاز حسب السور' : 'Progress by Surah'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {surahData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {lang === 'ar'
                  ? 'لم يتم تسجيل أي سورة في جلساتك بعد. أضف اسم السورة عند إنشاء الجلسة.'
                  : 'No surahs logged yet. Add a surah when creating a session.'}
              </p>
            ) : (
              <>
                <div className="h-56" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={surahData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="surah" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={0} angle={-20} textAnchor="end" height={50} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="verses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={lang === 'ar' ? 'الآيات' : 'Verses'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {surahData.map(s => (
                    <div key={s.surah} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{s.surah}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{s.sessions} {lang === 'ar' ? 'جلسة' : 'sessions'}</span>
                        <span>{s.verses} {lang === 'ar' ? 'آية' : 'verses'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {loading && (
          <p className="text-center text-sm text-muted-foreground">...</p>
        )}
      </main>
    </div>
  );
}
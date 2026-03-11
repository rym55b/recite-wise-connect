import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MessageSquare, ArrowRight, BookOpen, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Navbar } from '@/components/Navbar';
import { IslamicPattern } from '@/components/IslamicPattern';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserProfileData {
  id: string;
  display_name: string;
  gender: string;
  level: string;
  average_rating: number | null;
  total_sessions: number | null;
  avatar_url: string | null;
  is_available: boolean;
  created_at: string;
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { t, dir } = useI18n();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentRatings, setRecentRatings] = useState<any[]>([]);

  const isOwnProfile = profile?.id === id;

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const [profileRes, ratingsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('ratings')
          .select('*, rater:profiles!ratings_rater_id_fkey(display_name)')
          .eq('rated_id', id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setUserData(profileRes.data as UserProfileData | null);
      setRecentRatings(ratingsRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const levelLabel = (l: string) => {
    const map: Record<string, string> = {
      beginner: t('beginner'),
      intermediate: t('intermediate'),
      advanced: t('advanced'),
    };
    return map[l] || l;
  };

  if (loading) {
    return (
      <div dir={dir} className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div dir={dir} className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">المستخدم غير موجود</p>
        </div>
      </div>
    );
  }

  const rating = Number(userData.average_rating || 0).toFixed(1);
  const sessions = userData.total_sessions || 0;
  const joinDate = new Date(userData.created_at).toLocaleDateString('ar', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-lg px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" /> {t('home')}
        </Button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl gradient-emerald p-6 text-primary-foreground mb-6"
        >
          <IslamicPattern className="text-primary-foreground" opacity={0.08} />
          <div className="relative z-10 flex flex-col items-center text-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-foreground/20 border-2 border-primary-foreground/30">
              <span className="text-3xl font-bold">{userData.display_name[0]}</span>
            </div>
            <h1 className="text-2xl font-bold">{userData.display_name}</h1>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                {levelLabel(userData.level)}
              </Badge>
              {userData.is_available && (
                <Badge variant="secondary" className="bg-green-500/20 text-primary-foreground">
                  متاح
                </Badge>
              )}
            </div>
            <p className="text-primary-foreground/60 text-sm">عضو منذ {joinDate}</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center py-4">
              <div className="flex items-center gap-1 text-gold mb-1">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-xl font-bold">{rating}</span>
              </div>
              <p className="text-xs text-muted-foreground">التقييم</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center py-4">
              <div className="flex items-center gap-1 text-primary mb-1">
                <BookOpen className="h-5 w-5" />
                <span className="text-xl font-bold">{sessions}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('sessions')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        {profile && !isOwnProfile && (
          <div className="mb-6">
            <Button
              className="w-full gradient-emerald border-0 text-primary-foreground gap-2"
              onClick={() => navigate(`/messages?chat=${userData.id}`)}
            >
              <MessageSquare className="h-5 w-5" />
              مراسلة {userData.display_name}
            </Button>
          </div>
        )}

        {isOwnProfile && (
          <div className="mb-6">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => navigate('/profile')}
            >
              تعديل الملف الشخصي
            </Button>
          </div>
        )}

        {/* Recent Ratings */}
        {recentRatings.length > 0 && (
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                آخر التقييمات
              </h3>
              <div className="space-y-3">
                {recentRatings.map(r => (
                  <div key={r.id} className="flex items-start justify-between rounded-lg border border-border/50 p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{r.rater?.display_name}</p>
                      {r.comment && (
                        <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 text-gold shrink-0">
                      {Array.from({ length: r.stars }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Navbar } from '@/components/Navbar';
import { IslamicPattern } from '@/components/IslamicPattern';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

export default function ResetPassword() {
  const { dir } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase auto-exchanges the recovery token in the URL and fires PASSWORD_RECOVERY.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'خطأ', description: 'كلمتا المرور غير متطابقتين', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: 'تم', description: 'تم تحديث كلمة المرور بنجاح.' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <Navbar />
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
        <IslamicPattern className="text-foreground" opacity={0.03} />
        <Card className="relative z-10 w-full max-w-md border-border/50 bg-card/90 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">إعادة تعيين كلمة المرور</CardTitle>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                جارٍ التحقق من رابط الاسترجاع…
              </p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      type={show ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute end-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>تأكيد كلمة المرور</Label>
                  <Input
                    type={show ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-emerald border-0 text-primary-foreground"
                  disabled={loading}
                >
                  {loading ? '...' : 'تحديث كلمة المرور'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
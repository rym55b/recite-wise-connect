import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Trash2, UserX, UserCheck, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoles, type AppRole } from '@/hooks/useRoles';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ReportRow {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  resolution_notes: string | null;
  reported_session_id: string | null;
  reporter: { id: string; display_name: string } | null;
  reported_user: { id: string; display_name: string; user_id: string } | null;
}

interface UserRow {
  id: string;
  user_id: string;
  display_name: string;
  is_available: boolean;
  roles: AppRole[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-600',
  reviewing: 'bg-blue-500/15 text-blue-600',
  resolved: 'bg-emerald-500/15 text-emerald-600',
  dismissed: 'bg-muted text-muted-foreground',
};

export default function Admin() {
  const { profile, loading: authLoading } = useAuth();
  const { isAdmin, isModerator, loading: rolesLoading } = useRoles();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [resolutionDraft, setResolutionDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || rolesLoading) return;
    if (!profile || !isModerator) {
      navigate('/dashboard');
    }
  }, [authLoading, rolesLoading, profile, isModerator, navigate]);

  const loadReports = async () => {
    let q = supabase
      .from('reports')
      .select(`
        id, reason, details, status, created_at, resolution_notes, reported_session_id,
        reporter:profiles!reports_reporter_id_fkey(id, display_name),
        reported_user:profiles!reports_reported_user_id_fkey(id, display_name, user_id)
      `)
      .order('created_at', { ascending: false })
      .limit(100);
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    const { data, error } = await q;
    if (error) {
      toast({ title: 'فشل تحميل البلاغات', description: error.message, variant: 'destructive' });
      return;
    }
    setReports((data || []) as any);
  };

  const loadUsers = async () => {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, is_available')
      .order('display_name')
      .limit(200);
    const { data: roleRows } = await supabase
      .from('user_roles')
      .select('user_id, role');
    const roleMap = new Map<string, AppRole[]>();
    (roleRows || []).forEach((r: any) => {
      const list = roleMap.get(r.user_id) || [];
      list.push(r.role);
      roleMap.set(r.user_id, list);
    });
    setUsers(((profs || []) as any[]).map(p => ({ ...p, roles: roleMap.get(p.user_id) || [] })));
  };

  useEffect(() => {
    if (!isModerator) return;
    setLoading(true);
    Promise.all([loadReports(), loadUsers()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModerator, statusFilter]);

  const updateReportStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('reports')
      .update({
        status,
        resolution_notes: resolutionDraft[id] ?? null,
        resolved_by: profile?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) {
      toast({ title: 'فشل التحديث', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم التحديث' });
    loadReports();
  };

  const deleteReport = async (id: string) => {
    if (!isAdmin) return;
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) {
      toast({ title: 'فشل الحذف', description: error.message, variant: 'destructive' });
      return;
    }
    setReports(r => r.filter(x => x.id !== id));
  };

  const toggleAvailability = async (u: UserRow) => {
    if (!isAdmin) return;
    const next = !u.is_available;
    const { error } = await supabase
      .from('profiles')
      .update({ is_available: next })
      .eq('id', u.id);
    if (error) {
      toast({ title: 'فشل', description: error.message, variant: 'destructive' });
      return;
    }
    setUsers(list => list.map(x => x.id === u.id ? { ...x, is_available: next } : x));
    toast({ title: next ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب' });
  };

  const toggleRole = async (u: UserRow, role: AppRole) => {
    if (!isAdmin) return;
    const has = u.roles.includes(role);
    if (has) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', u.user_id)
        .eq('role', role);
      if (error) {
        toast({ title: 'فشل', description: error.message, variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: u.user_id, role });
      if (error) {
        toast({ title: 'فشل', description: error.message, variant: 'destructive' });
        return;
      }
    }
    setUsers(list => list.map(x => x.id === u.id
      ? { ...x, roles: has ? x.roles.filter(r => r !== role) : [...x.roles, role] }
      : x));
  };

  const filteredUsers = users.filter(u =>
    !search || u.display_name.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || rolesLoading || !isModerator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-emerald">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">لوحة الإشراف</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'مدير' : 'مشرف'} — إدارة البلاغات والمستخدمين
            </p>
          </div>
        </div>

        <Tabs defaultValue="reports">
          <TabsList>
            <TabsTrigger value="reports">البلاغات</TabsTrigger>
            <TabsTrigger value="users" disabled={!isAdmin}>المستخدمون والصلاحيات</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="reviewing">قيد المراجعة</SelectItem>
                  <SelectItem value="resolved">تم الحل</SelectItem>
                  <SelectItem value="dismissed">مرفوضة</SelectItem>
                  <SelectItem value="all">الكل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <p className="text-muted-foreground text-sm">جارٍ التحميل...</p>
            ) : reports.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">
                لا توجد بلاغات.
              </CardContent></Card>
            ) : reports.map(r => (
              <Card key={r.id} className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      <CardTitle className="text-base">{r.reason}</CardTitle>
                    </div>
                    <Badge className={STATUS_COLORS[r.status] || ''}>{r.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="text-muted-foreground">
                    <span>المُبلِّغ: </span>
                    <button className="underline" onClick={() => r.reporter && navigate(`/user/${r.reporter.id}`)}>
                      {r.reporter?.display_name || '—'}
                    </button>
                    {r.reported_user && (
                      <>
                        <span className="mx-2">·</span>
                        <span>المُبلَّغ عنه: </span>
                        <button className="underline" onClick={() => navigate(`/user/${r.reported_user!.id}`)}>
                          {r.reported_user.display_name}
                        </button>
                      </>
                    )}
                    {r.reported_session_id && (
                      <>
                        <span className="mx-2">·</span>
                        <span>جلسة: {r.reported_session_id.slice(0, 8)}…</span>
                      </>
                    )}
                    <span className="mx-2">·</span>
                    <span>{new Date(r.created_at).toLocaleString('ar')}</span>
                  </div>
                  {r.details && (
                    <div className="rounded-md bg-muted/40 p-3 text-foreground whitespace-pre-wrap">
                      {r.details}
                    </div>
                  )}
                  {r.resolution_notes && (
                    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
                      <span className="font-medium">ملاحظة الإشراف: </span>{r.resolution_notes}
                    </div>
                  )}
                  <Textarea
                    placeholder="ملاحظات الحل (اختياري)"
                    value={resolutionDraft[r.id] ?? ''}
                    onChange={e => setResolutionDraft(d => ({ ...d, [r.id]: e.target.value }))}
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => updateReportStatus(r.id, 'reviewing')}>
                      قيد المراجعة
                    </Button>
                    <Button size="sm" onClick={() => updateReportStatus(r.id, 'resolved')}>
                      تم الحل
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateReportStatus(r.id, 'dismissed')}>
                      رفض
                    </Button>
                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="ms-auto gap-1">
                            <Trash2 className="h-3.5 w-3.5" /> حذف
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف البلاغ نهائياً؟</AlertDialogTitle>
                            <AlertDialogDescription>لا يمكن التراجع.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteReport(r.id)}>حذف</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="users" className="space-y-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder="ابحث عن مستخدم..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {filteredUsers.map(u => (
              <Card key={u.id} className="border-border/50">
                <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {u.display_name[0]}
                    </div>
                    <div className="min-w-0">
                      <button className="font-medium hover:underline truncate"
                              onClick={() => navigate(`/user/${u.id}`)}>
                        {u.display_name}
                      </button>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {u.roles.map(r => (
                          <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                        ))}
                        {!u.is_available && <Badge variant="destructive" className="text-[10px]">موقوف</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant={u.roles.includes('moderator') ? 'default' : 'outline'}
                            onClick={() => toggleRole(u, 'moderator')}>
                      مشرف
                    </Button>
                    <Button size="sm" variant={u.roles.includes('admin') ? 'default' : 'outline'}
                            onClick={() => toggleRole(u, 'admin')}>
                      مدير
                    </Button>
                    <Button size="sm" variant={u.is_available ? 'destructive' : 'secondary'}
                            className="gap-1"
                            onClick={() => toggleAvailability(u)}>
                      {u.is_available ? <><UserX className="h-3.5 w-3.5" /> إيقاف</>
                                       : <><UserCheck className="h-3.5 w-3.5" /> تفعيل</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
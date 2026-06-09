import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { IslamicPattern } from '@/components/IslamicPattern';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { ShieldCheck, ShieldAlert, ShieldX, ExternalLink, Search, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type Severity = 'critical' | 'high' | 'warn' | 'info';
type Status = 'fixed' | 'ignored' | 'open';
type Scanner = 'supabase_lov' | 'supabase' | 'connector_security_scan' | 'wiz' | 'aikido';

interface Finding {
  id: string;
  scanner: Scanner;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  resolvedAt?: string;
  migration?: string;
  ticket?: string;
  note?: string;
}

const FINDINGS: Finding[] = [
  {
    id: 'session_participants_update_no_check',
    scanner: 'supabase_lov',
    title: "Session host could reassign a participant's identity",
    description:
      'The UPDATE policy on session_participants lacked a WITH CHECK clause, letting a session creator change user_id and forge membership.',
    severity: 'warn',
    status: 'fixed',
    resolvedAt: '2026-06-09',
    migration: '20260609210101_2922ba21-7b40-457b-9e1b-bfa580ed444f.sql',
    note: 'Added WITH CHECK + guard_session_participants_update trigger blocking identity-field changes.',
  },
  {
    id: 'sessions_update_field_restriction',
    scanner: 'supabase_lov',
    title: 'Sessions UPDATE could mutate sensitive fields',
    description:
      'Non-creators could potentially modify access_code, is_public, creator_id, user1_id, user2_id, etc. via the sessions UPDATE policy.',
    severity: 'warn',
    status: 'fixed',
    resolvedAt: '2026-06-03',
    migration: '20260603225946_858b20a7-c1c9-4449-ab5d-fabcf1198c2d.sql',
    note: 'Added guard_sessions_update SECURITY DEFINER trigger and WITH CHECK on the policy.',
  },
  {
    id: 'invitations_update_status_check',
    scanner: 'supabase_lov',
    title: 'Invitation status transitions were unrestricted',
    description:
      'Receivers could move invitations to any status. Tightened to only pending → accepted/rejected.',
    severity: 'warn',
    status: 'fixed',
    resolvedAt: '2026-06-03',
    migration: '20260603225847_5949e37b-da9c-4d98-b449-2f593949195c.sql',
  },
  {
    id: 'session_participants_select_leak',
    scanner: 'supabase_lov',
    title: 'Participant list of unrelated public sessions was readable',
    description:
      'SELECT policy on session_participants leaked member lists for sessions the user was not part of.',
    severity: 'warn',
    status: 'fixed',
    resolvedAt: '2026-06-03',
    migration: '20260603225821_e7db9b47-7301-426e-84e8-d26d3ed9e6c6.sql',
  },
  {
    id: 'security_definer_get_my_profile_id',
    scanner: 'supabase',
    title: 'SECURITY DEFINER function executable by authenticated/anon',
    description:
      'get_my_profile_id and is_session_participant are callable by signed-in (and anon) users.',
    severity: 'warn',
    status: 'ignored',
    note: 'Intentional — required by RLS policies; returns only caller-scoped data. See security memory.',
  },
  {
    id: 'realtime_channel_authorization',
    scanner: 'supabase',
    title: 'No RLS on realtime.messages channel topics',
    description:
      'Any authenticated user can subscribe to any Realtime channel topic.',
    severity: 'info',
    status: 'ignored',
    note: 'WebRTC signaling is ephemeral; postgres_changes payloads remain RLS-filtered.',
  },
  {
    id: 'connector_scan',
    scanner: 'connector_security_scan',
    title: 'Connector security scan — clean',
    description: 'No findings from connector_security_scan at last run.',
    severity: 'info',
    status: 'fixed',
    resolvedAt: '2026-06-03',
  },
];

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
  high: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  warn: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  info: 'bg-muted text-muted-foreground border-border',
};

const STATUS_STYLES: Record<Status, string> = {
  fixed: 'bg-primary/15 text-primary border-primary/30',
  ignored: 'bg-muted text-muted-foreground border-border',
  open: 'bg-destructive/15 text-destructive border-destructive/30',
};

const STATUS_ICON: Record<Status, JSX.Element> = {
  fixed: <ShieldCheck className="h-4 w-4" />,
  ignored: <ShieldAlert className="h-4 w-4" />,
  open: <ShieldX className="h-4 w-4" />,
};

const GITHUB_BASE =
  'https://github.com/'; // placeholder — migration links open via Supabase dashboard or local repo

function migrationHref(file: string) {
  return `/supabase/migrations/${file}`;
}

export default function Security() {
  const { dir } = useI18n();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | Status>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAuthorized(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator']);
      setAuthorized((data?.length ?? 0) > 0);
    })();
  }, [user, authLoading]);

  const filtered = useMemo(() => {
    return FINDINGS.filter(f => {
      if (filter !== 'all' && f.status !== filter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.scanner.toLowerCase().includes(q)
      );
    });
  }, [query, filter]);

  const counts = useMemo(() => {
    return {
      total: FINDINGS.length,
      fixed: FINDINGS.filter(f => f.status === 'fixed').length,
      ignored: FINDINGS.filter(f => f.status === 'ignored').length,
      open: FINDINGS.filter(f => f.status === 'open').length,
    };
  }, []);

  if (authLoading || authorized === null) {
    return (
      <div dir={dir} className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div dir={dir} className="min-h-screen bg-background">
        <Navbar />
        <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <IslamicPattern className="text-foreground" opacity={0.03} />
          <Card className="relative z-10 w-full max-w-md border-border/60 text-center">
            <CardHeader>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Lock className="h-7 w-7 text-muted-foreground" />
              </div>
              <CardTitle>Accès réservé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cette page est réservée aux administrateurs et mainteneurs du projet.
                Si vous pensez qu'il s'agit d'une erreur, contactez un administrateur.
              </p>
              <Button onClick={() => navigate(user ? '/dashboard' : '/auth')} className="w-full">
                {user ? 'Retour au tableau de bord' : 'Se connecter'}
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <Navbar />
      <section className="relative">
        <IslamicPattern className="text-foreground" opacity={0.03} />
        <div className="container relative z-10 mx-auto max-w-5xl px-4 py-8">
          <header className="mb-6 flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              Security findings
            </h1>
            <p className="text-muted-foreground">
              All known findings from the project security scans (Supabase, connector, Wiz, Aikido) with their current status.
            </p>
          </header>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total" value={counts.total} />
            <StatCard label="Fixed" value={counts.fixed} tone="primary" />
            <StatCard label="Ignored" value={counts.ignored} />
            <StatCard label="Open" value={counts.open} tone={counts.open > 0 ? 'destructive' : undefined} />
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search findings…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'open', 'fixed', 'ignored'] as const).map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={filter === s ? 'default' : 'outline'}
                  onClick={() => setFilter(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="py-12 text-center text-muted-foreground">No findings match.</p>
            )}
            {filtered.map(f => (
              <Card key={f.id} className="border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">{f.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={SEVERITY_STYLES[f.severity]}>
                        {f.severity}
                      </Badge>
                      <Badge variant="outline" className={`${STATUS_STYLES[f.status]} gap-1`}>
                        {STATUS_ICON[f.status]} {f.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{f.description}</p>
                  {f.note && (
                    <p className="rounded-md border border-border/50 bg-muted/40 p-2 text-xs">
                      <strong className="font-medium">Note:</strong> {f.note}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                    <span>Scanner: <code className="rounded bg-muted px-1.5 py-0.5">{f.scanner}</code></span>
                    {f.resolvedAt && <span>Resolved: {f.resolvedAt}</span>}
                    {f.migration && (
                      <a
                        href={migrationHref(f.migration)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Migration <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {f.ticket && (
                      <a
                        href={f.ticket}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Ticket <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'primary' | 'destructive' }) {
  const toneClass =
    tone === 'primary'
      ? 'text-primary'
      : tone === 'destructive'
        ? 'text-destructive'
        : 'text-foreground';
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

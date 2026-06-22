import { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Flag } from 'lucide-react';

const schema = z.object({
  reason: z.string().min(1).max(80),
  details: z.string().trim().max(1000).optional(),
});

interface Props {
  reportedUserId?: string;
  reportedSessionId?: string;
  trigger?: React.ReactNode;
}

const REASONS = [
  'محتوى غير لائق',
  'سلوك مسيء',
  'انتحال شخصية',
  'مخالفة الأخلاق الإسلامية',
  'سبام أو إعلانات',
  'أخرى',
];

export function ReportDialog({ reportedUserId, reportedSessionId, trigger }: Props) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!profile) return;
    const parsed = schema.safeParse({ reason, details });
    if (!parsed.success) {
      toast({ title: 'بيانات غير صالحة', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: profile.id,
      reported_user_id: reportedUserId ?? null,
      reported_session_id: reportedSessionId ?? null,
      reason: parsed.data.reason,
      details: parsed.data.details || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'تعذر إرسال البلاغ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم إرسال البلاغ', description: 'سيراجعه فريق الإشراف قريباً' });
    setDetails('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Flag className="h-4 w-4" /> إبلاغ
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>الإبلاغ</DialogTitle>
          <DialogDescription>
            ساعدنا في الحفاظ على بيئة آمنة. سيتم مراجعة بلاغك بسرية.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>السبب</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>تفاصيل (اختياري)</Label>
            <Textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="صف الحادثة بإيجاز..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button onClick={submit} disabled={submitting}>إرسال البلاغ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
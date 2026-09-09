import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { SURAHS } from '@/lib/surahs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export interface Passage {
  surah: string | null;
  from: number | null;
  to: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStart: (p: Passage) => void;
}

export function PassageDialog({ open, onOpenChange, onStart }: Props) {
  const [surah, setSurah] = useState<string>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const start = () => {
    onStart({
      surah: surah || null,
      from: from ? parseInt(from, 10) : null,
      to: to ? parseInt(to, 10) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">هل تريد تحديد ما ستقرأه؟</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">السورة</Label>
            <Select value={surah} onValueChange={setSurah}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="اختر السورة (اختياري)" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {SURAHS.map((s, i) => (
                  <SelectItem key={s} value={s}>{i + 1}. {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-sm text-muted-foreground">من الآية</Label>
              <Input type="number" min={1} value={from} onChange={e => setFrom(e.target.value)} className="h-11" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-sm text-muted-foreground">إلى الآية</Label>
              <Input type="number" min={1} value={to} onChange={e => setTo(e.target.value)} className="h-11" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            هذا الاختيار اختياري، ويمكنك تحديد المقطع أثناء الجلسة.
          </p>

          <Button
            onClick={start}
            className="w-full h-12 gap-2 gradient-emerald border-0 text-primary-foreground text-base"
          >
            <Search className="h-4 w-4" /> البحث عن شريك
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

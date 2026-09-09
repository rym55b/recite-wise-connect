import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WaitingCounts {
  readers: number;
  correctors: number;
  total: number;
}

/** عدد الأشخاص المنتظرين حالياً (نفس الجنس فقط، أرقام فقط بدون أي بيانات شخصية) */
export function useWaitingCounts(intervalMs = 5000) {
  const [counts, setCounts] = useState<WaitingCounts>({ readers: 0, correctors: 0, total: 0 });

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase.rpc('get_waiting_counts');
      const row: any = Array.isArray(data) ? data[0] : data;
      if (!active || !row) return;
      const readers = Number(row.readers) || 0;
      const correctors = Number(row.correctors) || 0;
      setCounts({ readers, correctors, total: readers + correctors });
    };

    load();
    const iv = setInterval(load, intervalMs);

    const channel = supabase
      .channel('waiting-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matchmaking_queue' }, () => load())
      .subscribe();

    return () => {
      active = false;
      clearInterval(iv);
      supabase.removeChannel(channel);
    };
  }, [intervalMs]);

  return counts;
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AppRole = 'admin' | 'moderator' | 'user';

export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    let active = true;
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!active) return;
        setRoles((data || []).map((r: any) => r.role as AppRole));
        setLoading(false);
      });
    return () => { active = false; };
  }, [user]);

  return {
    roles,
    loading,
    isAdmin: roles.includes('admin'),
    isModerator: roles.includes('admin') || roles.includes('moderator'),
  };
}
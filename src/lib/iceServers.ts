import { supabase } from '@/integrations/supabase/client';

const FALLBACK_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

let cachedConfig: RTCConfiguration | null = null;
let cacheExpiry = 0;

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function getIceServers(): Promise<RTCConfiguration> {
  if (cachedConfig && Date.now() < cacheExpiry) {
    return cachedConfig;
  }

  try {
    const { data, error } = await supabase.functions.invoke('get-turn-credentials');

    if (error || !data?.iceServers) {
      console.warn('Failed to fetch TURN credentials, using STUN fallback:', error);
      return FALLBACK_CONFIG;
    }

    cachedConfig = { iceServers: data.iceServers };
    cacheExpiry = Date.now() + CACHE_TTL;
    console.log('TURN credentials fetched successfully');
    return cachedConfig;
  } catch (err) {
    console.warn('TURN fetch error, using STUN fallback:', err);
    return FALLBACK_CONFIG;
  }
}

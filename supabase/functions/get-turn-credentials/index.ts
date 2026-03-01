import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('METERED_API_KEY');
    if (!apiKey) {
      throw new Error('METERED_API_KEY is not configured');
    }

    const response = await fetch(
      `https://quran.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Metered API error [${response.status}]: ${await response.text()}`);
    }

    const iceServers = await response.json();

    return new Response(JSON.stringify({ iceServers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching TURN credentials:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

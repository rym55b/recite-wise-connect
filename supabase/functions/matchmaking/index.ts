import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { userId, sessionType, gender } = await req.json();

    // Find another user in the queue with same session type and gender
    const { data: queueEntries } = await supabase
      .from('matchmaking_queue')
      .select('user_id, profiles!inner(id, gender)')
      .eq('session_type', sessionType)
      .neq('user_id', userId)
      .limit(10);

    // Filter by gender
    const match = queueEntries?.find((entry: any) => entry.profiles?.gender === gender);

    if (match) {
      // Create session
      const { data: session } = await supabase
        .from('sessions')
        .insert({
          session_type: sessionType,
          user1_id: userId,
          user2_id: match.user_id,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      // Remove both from queue
      await supabase.from('matchmaking_queue').delete().in('user_id', [userId, match.user_id]);

      return new Response(JSON.stringify({ sessionId: session?.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ sessionId: null, message: 'No match found yet' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

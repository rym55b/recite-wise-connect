import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_my_invitations",
  title: "List my pending invitations",
  description: "List invitations addressed to the signed-in user that are still pending.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (!profile) return { content: [{ type: "text", text: "No profile found." }] };
    const { data, error } = await supabase
      .from("invitations")
      .select("id, sender_id, session_type, status, created_at")
      .eq("receiver_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { invitations: data ?? [] },
    };
  },
});
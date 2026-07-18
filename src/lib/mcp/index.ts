import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfileTool from "./tools/get-my-profile";
import listMySessionsTool from "./tools/list-my-sessions";
import listMyInvitationsTool from "./tools/list-my-invitations";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "tajweed-mcp",
  title: "Tajweed MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Tajweed recitation app. Read the signed-in user's profile, recent recitation sessions, and pending invitations. All access is scoped to the authenticated user via RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfileTool, listMySessionsTool, listMyInvitationsTool],
});
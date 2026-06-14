import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Matchmaking from "./pages/Matchmaking";
import Session from "./pages/Session";
import CreateGroupSession from "./pages/CreateGroupSession";
import GroupSession from "./pages/GroupSession";
import Stats from "./pages/Stats";
import Invitations from "./pages/Invitations";
import Messages from "./pages/Messages";
import UserProfile from "./pages/UserProfile";
import Security from "./pages/Security";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/matchmaking" element={<Matchmaking />} />
                <Route path="/session/:id" element={<Session />} />
                <Route path="/create-group-session" element={<CreateGroupSession />} />
                <Route path="/group-session/:id" element={<GroupSession />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/invitations" element={<Invitations />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/user/:id" element={<UserProfile />} />
                <Route path="/security" element={<Security />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

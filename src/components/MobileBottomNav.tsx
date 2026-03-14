import { Home, MessageSquare, BarChart3, User, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';

const navItems = [
  { icon: Home, path: '/dashboard', labelKey: 'dashboard' },
  { icon: Search, path: '/matchmaking?role=reader', labelKey: 'startSession' },
  { icon: MessageSquare, path: '/messages', labelKey: 'messages' },
  { icon: BarChart3, path: '/stats', labelKey: 'statistics' },
  { icon: User, path: '/profile', labelKey: 'profile' },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-md md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path.split('?')[0];
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{t(item.labelKey as any)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

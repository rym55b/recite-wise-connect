import { Moon, Sun, Globe, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-3 md:px-4">
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => navigate(user ? '/dashboard' : '/')}>
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl gradient-emerald">
            <span className="text-sm md:text-lg font-bold text-primary-foreground">ت</span>
          </div>
          <h1 className="text-base md:text-xl font-bold text-foreground">{t('appName')}</h1>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} className="rounded-full h-8 w-8 md:h-10 md:w-10" title={t('language')}>
            <Globe className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-8 w-8 md:h-10 md:w-10" title={theme === 'dark' ? t('lightMode') : t('darkMode')}>
            {theme === 'dark' ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
          </Button>

          {user ? (
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:h-10 md:w-10 hidden md:inline-flex" onClick={signOut}>
              <LogOut className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          ) : (
            <Button size="sm" className="gradient-emerald border-0 text-primary-foreground hover:opacity-90 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4" onClick={() => navigate('/auth')}>
              {t('signup')}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

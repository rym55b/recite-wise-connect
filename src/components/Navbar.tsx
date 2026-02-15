import { Moon, Sun, Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';


export function Navbar() {
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-emerald">
            <span className="text-lg font-bold text-primary-foreground">ت</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">{t('appName')}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="rounded-full"
            title={t('language')}
          >
            <Globe className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            {t('login')}
          </Button>
          <Button size="sm" className="gradient-emerald border-0 text-primary-foreground hover:opacity-90">
            {t('signup')}
          </Button>
        </div>
      </div>
    </header>
  );
}

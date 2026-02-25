'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/context/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { BookOpen, Globe, LogOut, Settings, Users } from 'lucide-react'

const translations = {
  ar: {
    home: 'الرئيسية',
    quran: 'القرآن',
    tutors: 'المعلمون',
    sessions: 'الجلسات',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    login: 'دخول',
    signup: 'إنشاء حساب',
    language: 'اللغة',
  },
  en: {
    home: 'Home',
    quran: 'Quran',
    tutors: 'Tutors',
    sessions: 'Sessions',
    profile: 'Profile',
    logout: 'Logout',
    login: 'Login',
    signup: 'Sign Up',
    language: 'Language',
  },
}

export function Navbar() {
  const { user, logout } = useAuth()
  const { language, setLanguage } = useLanguage()
  const t = translations[language]

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="text-foreground">قرآن</span>
        </Link>

        {/* Main Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-foreground hover:text-primary transition">
            {t.home}
          </Link>
          <Link href="/quran" className="text-foreground hover:text-primary transition">
            {t.quran}
          </Link>
          <Link href="/tutors" className="text-foreground hover:text-primary transition">
            {t.tutors}
          </Link>
          {user && (
            <Link href="/sessions" className="text-foreground hover:text-primary transition">
              {t.sessions}
            </Link>
          )}
        </div>

        {/* Right Side - Auth & Settings */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'ar' ? 'العربية' : 'English'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('ar')}>
                العربية
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="hidden sm:inline text-sm">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>{t.profile}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="gap-2 text-destructive">
                  <LogOut className="w-4 h-4" />
                  {t.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">{t.login}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/signup">{t.signup}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

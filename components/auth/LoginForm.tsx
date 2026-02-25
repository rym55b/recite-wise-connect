'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const translations = {
  ar: {
    title: 'دخول',
    description: 'قم بتسجيل الدخول للمتابعة مع المعلمين',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    signin: 'دخول',
    noAccount: 'ليس لديك حساب؟',
    signup: 'إنشاء حساب',
    error: 'خطأ في تسجيل الدخول',
    signingIn: 'جاري الدخول...',
    demoHint: 'تلميح: استخدم ahmed@example.com / password123',
  },
  en: {
    title: 'Login',
    description: 'Sign in to start learning with our tutors',
    email: 'Email',
    password: 'Password',
    signin: 'Sign In',
    noAccount: "Don't have an account?",
    signup: 'Sign Up',
    error: 'Login failed',
    signingIn: 'Signing in...',
    demoHint: 'Tip: Use ahmed@example.com / password123',
  },
}

export function LoginForm() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const { language } = useLanguage()
  const t = translations[language]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{t.demoHint}</AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              placeholder="ahmed@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t.signingIn : t.signin}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">{t.noAccount} </span>
          <Button
            variant="link"
            className="p-0 h-auto font-semibold"
            onClick={() => router.push('/auth/signup')}
          >
            {t.signup}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

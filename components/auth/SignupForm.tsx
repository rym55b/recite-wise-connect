'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const translations = {
  ar: {
    title: 'إنشاء حساب جديد',
    description: 'انضم إلى مجتمع متعلمي القرآن',
    name: 'الاسم بالعربية',
    nameEn: 'الاسم بالإنجليزية',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    role: 'نوع الحساب',
    student: 'طالب',
    tutor: 'معلم',
    signup: 'إنشاء حساب',
    haveAccount: 'هل لديك حساب بالفعل؟',
    login: 'دخول',
    error: 'خطأ في إنشاء الحساب',
    signingUp: 'جاري الإنشاء...',
  },
  en: {
    title: 'Create Account',
    description: 'Join our Quranic learning community',
    name: 'Name in Arabic',
    nameEn: 'Name in English',
    email: 'Email',
    password: 'Password',
    role: 'Account Type',
    student: 'Student',
    tutor: 'Tutor',
    signup: 'Create Account',
    haveAccount: 'Already have an account?',
    login: 'Login',
    error: 'Signup failed',
    signingUp: 'Creating account...',
  },
}

export function SignupForm() {
  const router = useRouter()
  const { signup, isLoading } = useAuth()
  const { language } = useLanguage()
  const t = translations[language]

  const [name, setName] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'student' | 'tutor'>('student')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !nameEn || !email || !password) {
      setError('جميع الحقول مطلوبة')
      return
    }

    try {
      await signup(name, nameEn, email, password, role)
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.name}</Label>
            <Input
              id="name"
              placeholder="أحمد محمد"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameEn">{t.nameEn}</Label>
            <Input
              id="nameEn"
              placeholder="Ahmed Mohammed"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

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

          <div className="space-y-2">
            <Label>{t.role}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={role === 'student' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setRole('student')}
                disabled={isLoading}
              >
                {t.student}
              </Button>
              <Button
                type="button"
                variant={role === 'tutor' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setRole('tutor')}
                disabled={isLoading}
              >
                {t.tutor}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t.signingUp : t.signup}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">{t.haveAccount} </span>
          <Button
            variant="link"
            className="p-0 h-auto font-semibold"
            onClick={() => router.push('/auth/login')}
          >
            {t.login}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getSessionsByStudent } from '@/lib/data/sessions'
import { getUserById } from '@/lib/data/users'
import { Clock, Calendar, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

const translations = {
  ar: {
    mySessions: 'جلساتي',
    description: 'إدارة ومتابعة جلساتك مع المعلمين',
    noSessions: 'لا توجد جلسات مقررة حالياً',
    bookFirstSession: 'احجز جلستك الأولى',
    loginFirst: 'يجب تسجيل الدخول أولاً',
    status: 'الحالة',
    date: 'التاريخ',
    time: 'الوقت',
    duration: 'المدة',
    tutor: 'المعلم',
    details: 'التفاصيل',
    pending: 'في الانتظار',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    cancelled: 'ملغى',
  },
  en: {
    mySessions: 'My Sessions',
    description: 'Manage and track your learning sessions with tutors',
    noSessions: 'No sessions scheduled yet',
    bookFirstSession: 'Book Your First Session',
    loginFirst: 'Please login first',
    status: 'Status',
    date: 'Date',
    time: 'Time',
    duration: 'Duration',
    tutor: 'Tutor',
    details: 'Details',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
  },
}

const statusVariants = {
  pending: 'secondary',
  confirmed: 'default',
  completed: 'outline',
  cancelled: 'destructive',
} as const

export default function SessionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = translations[language]

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t.loginFirst}
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </>
    )
  }

  const sessions = getSessionsByStudent(user.id)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{t.mySessions}</h1>
            <p className="text-muted-foreground">{t.description}</p>
          </div>

          {/* Sessions List */}
          {sessions.length > 0 ? (
            <div className="grid gap-4">
              {sessions.map((session) => {
                const tutor = getUserById(session.tutorId)
                const sessionDate = new Date(session.scheduledAt)
                const statusLabel = t[session.status as keyof typeof t]

                return (
                  <Card key={session.id} className="hover:shadow-lg transition">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                        {/* Tutor Info */}
                        <div>
                          {tutor && (
                            <div className="flex items-center gap-3">
                              <img
                                src={tutor.avatar}
                                alt={tutor.name}
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <p className="font-semibold">{tutor.name}</p>
                                <p className="text-xs text-muted-foreground">{t.tutor}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {sessionDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </p>
                          <p className="text-xs text-muted-foreground">{t.date}</p>
                        </div>

                        {/* Time */}
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {sessionDate.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">{session.duration} دقيقة</p>
                        </div>

                        {/* Status */}
                        <div>
                          <Badge variant={statusVariants[session.status]}>
                            {statusLabel}
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/sessions/${session.id}`)}
                          >
                            {t.details}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground mb-6">{t.noSessions}</p>
                <Button asChild size="lg">
                  <Link href="/tutors">{t.bookFirstSession}</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}

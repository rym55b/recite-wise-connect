'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSessionById, updateSession } from '@/lib/data/sessions'
import { getUserById } from '@/lib/data/users'
import { getSurahByNumber } from '@/lib/data/quran'
import { addReview, getReviewsBySession } from '@/lib/data/reviews'
import { Calendar, Clock, BookOpen, Star, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

const translations = {
  ar: {
    sessionDetails: 'تفاصيل الجلسة',
    status: 'الحالة',
    date: 'التاريخ',
    time: 'الوقت',
    duration: 'المدة',
    tutor: 'المعلم',
    student: 'الطالب',
    surah: 'السورة',
    notes: 'الملاحظات',
    rating: 'التقييم',
    rateSession: 'قيّم هذه الجلسة',
    comment: 'تعليقك',
    submitReview: 'إرسال التقييم',
    review: 'التقييم',
    noNotes: 'لا توجد ملاحظات',
    pending: 'في الانتظار',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    cancelled: 'ملغى',
    confirmSession: 'تأكيد الجلسة',
    cancelSession: 'إلغاء الجلسة',
    completeSession: 'إنهاء الجلسة',
    backsessions: 'رجوع للجلسات',
  },
  en: {
    sessionDetails: 'Session Details',
    status: 'Status',
    date: 'Date',
    time: 'Time',
    duration: 'Duration',
    tutor: 'Tutor',
    student: 'Student',
    surah: 'Surah',
    notes: 'Notes',
    rating: 'Rating',
    rateSession: 'Rate This Session',
    comment: 'Your Comment',
    submitReview: 'Submit Review',
    review: 'Review',
    noNotes: 'No notes',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    confirmSession: 'Confirm Session',
    cancelSession: 'Cancel Session',
    completeSession: 'Complete Session',
    backsessions: 'Back to Sessions',
  },
}

const statusVariants = {
  pending: 'secondary',
  confirmed: 'default',
  completed: 'outline',
  cancelled: 'destructive',
} as const

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = translations[language]

  const sessionId = params.id as string
  const session = getSessionById(sessionId)
  const existingReview = session ? getReviewsBySession(sessionId) : null

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(!!existingReview)

  if (!session) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Session not found
              </AlertDescription>
            </Alert>
            <Button asChild className="mt-4">
              <Link href="/sessions">{t.backsessions}</Link>
            </Button>
          </div>
        </main>
      </>
    )
  }

  const tutor = getUserById(session.tutorId)
  const student = getUserById(session.studentId)
  const surah = session.surahFocus ? getSurahByNumber(session.surahFocus) : null
  const sessionDate = new Date(session.scheduledAt)
  const isCompleted = session.status === 'completed'
  const statusLabel = t[session.status as keyof typeof t]

  const handleConfirm = () => {
    if (user?.role === 'tutor') {
      updateSession(sessionId, { status: 'confirmed' })
      router.refresh()
    }
  }

  const handleComplete = () => {
    if (user?.role === 'tutor') {
      updateSession(sessionId, { status: 'completed' })
      router.refresh()
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) {
        router.push('/auth/login')
        return
      }

      const newReview = {
        id: `review_${Date.now()}`,
        sessionId: session.id,
        studentId: session.studentId,
        tutorId: session.tutorId,
        rating,
        comment,
        createdAt: new Date(),
      }

      addReview(newReview)
      updateSession(sessionId, { rating })
      setSubmitted(true)
      setComment('')
      setRating(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">{t.sessionDetails}</h1>
            <Button variant="outline" asChild>
              <Link href="/sessions">{t.backsessions}</Link>
            </Button>
          </div>

          {/* Main Details */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t.sessionDetails}</CardTitle>
                <Badge variant={statusVariants[session.status]}>
                  {statusLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tutor */}
              {tutor && (
                <div className="flex items-center gap-4 pb-4 border-b">
                  <img
                    src={tutor.avatar}
                    alt={tutor.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">{t.tutor}</p>
                    <p className="font-semibold">{tutor.name}</p>
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.date}</p>
                  <p className="flex items-center gap-2 font-semibold">
                    <Calendar className="w-4 h-4" />
                    {sessionDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.time}</p>
                  <p className="flex items-center gap-2 font-semibold">
                    <Clock className="w-4 h-4" />
                    {sessionDate.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t.duration}</p>
                <p className="font-semibold">{session.duration} دقيقة</p>
              </div>

              {/* Surah */}
              {surah && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.surah}</p>
                  <p className="font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {surah.name} ({surah.nameEn})
                  </p>
                </div>
              )}

              {/* Notes */}
              {session.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.notes}</p>
                  <p className="text-sm">{session.notes}</p>
                </div>
              )}

              {/* Tutor Actions */}
              {user?.id === session.tutorId && (
                <div className="border-t pt-4 space-y-3">
                  {session.status === 'pending' && (
                    <Button onClick={handleConfirm} className="w-full">
                      {t.confirmSession}
                    </Button>
                  )}
                  {session.status === 'confirmed' && (
                    <Button onClick={handleComplete} className="w-full">
                      {t.completeSession}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Section */}
          {isCompleted && user?.id === session.studentId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {t.rateSession}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submitted && existingReview ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">شكراً على التقييم!</p>
                    <div className="flex justify-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < (existingReview?.rating || 0)
                              ? 'fill-accent text-accent'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{existingReview.comment}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {/* Rating Stars */}
                    <div className="space-y-2">
                      <Label className="text-base">{t.rating}</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= rating
                                  ? 'fill-accent text-accent'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                      <Label htmlFor="comment">{t.comment}</Label>
                      <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="شارك تجربتك مع المعلم..."
                        rows={4}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || !rating}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {loading ? 'جاري الإرسال...' : t.submitReview}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}

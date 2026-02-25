'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from '@/lib/types'
import { addSession } from '@/lib/data/sessions'
import { surahs } from '@/lib/data/quran'
import { Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const translations = {
  ar: {
    bookSession: 'حجز جلسة',
    withTutor: 'مع المعلم',
    selectDate: 'اختر التاريخ',
    selectTime: 'اختر الوقت',
    duration: 'مدة الجلسة (دقيقة)',
    surah: 'السورة المراد التركيز عليها (اختياري)',
    notes: 'ملاحظاتك (اختياري)',
    book: 'حجز الآن',
    booking: 'جاري الحجز...',
    success: 'تم حجز الجلسة بنجاح!',
    error: 'خطأ في الحجز',
    durationError: 'يجب تحديد مدة صحيحة',
    dateError: 'يجب تحديد تاريخ صحيح',
  },
  en: {
    bookSession: 'Book Session',
    withTutor: 'With Tutor',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    duration: 'Session Duration (minutes)',
    surah: 'Surah to Focus On (optional)',
    notes: 'Your Notes (optional)',
    book: 'Book Now',
    booking: 'Booking...',
    success: 'Session booked successfully!',
    error: 'Booking error',
    durationError: 'Please enter a valid duration',
    dateError: 'Please select a valid date',
  },
}

interface SessionFormProps {
  tutor: User
}

export function SessionForm({ tutor }: SessionFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = translations[language]

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [surahId, setSurahId] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!date || !time) {
      setError(t.dateError)
      return
    }

    const durationNum = parseInt(duration)
    if (!durationNum || durationNum < 30 || durationNum > 180) {
      setError(t.durationError)
      return
    }

    if (!user) {
      router.push('/auth/login')
      return
    }

    setLoading(true)
    try {
      const [hours, minutes] = time.split(':')
      const sessionDate = new Date(date)
      sessionDate.setHours(parseInt(hours), parseInt(minutes), 0)

      const newSession = {
        id: `session_${Date.now()}`,
        studentId: user.id,
        tutorId: tutor.id,
        scheduledAt: sessionDate,
        duration: durationNum,
        status: 'pending' as const,
        surahFocus: surahId ? parseInt(surahId) : undefined,
        notes,
        createdAt: new Date(),
      }

      addSession(newSession)
      router.push(`/sessions/${newSession.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setLoading(false)
    }
  }

  // Get minimum date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t.bookSession}</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          {t.withTutor}: {tutor.name}
        </p>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t.selectDate}
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                required
                disabled={loading}
              />
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t.selectTime}
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">{t.duration}</Label>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map((dur) => (
                <Button
                  key={dur}
                  type="button"
                  variant={duration === dur.toString() ? 'default' : 'outline'}
                  onClick={() => setDuration(dur.toString())}
                  disabled={loading}
                >
                  {dur}
                </Button>
              ))}
            </div>
          </div>

          {/* Surah Selection */}
          <div className="space-y-2">
            <Label htmlFor="surah">{t.surah}</Label>
            <select
              id="surah"
              value={surahId}
              onChange={(e) => setSurahId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">اختر سورة...</option>
              {surahs.map((surah) => (
                <option key={surah.number} value={surah.number.toString()}>
                  {surah.name} ({surah.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t.notes}</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أي ملاحظات أو متطلبات خاصة..."
              disabled={loading}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading} size="lg">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? t.booking : t.book}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

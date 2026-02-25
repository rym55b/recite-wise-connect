'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/context/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, Clock, Star } from 'lucide-react'
import { getSessionsByStudent } from '@/lib/data/sessions'

const translations = {
  ar: {
    welcome: 'مرحباً بك في تطبيق القرآن',
    subtitle: 'تعلم القرآن الكريم مع أفضل المعلمين',
    getStarted: 'ابدأ الآن',
    features: 'المزايا',
    upcomingSessions: 'الجلسات القادمة',
    noSessions: 'لا توجد جلسات مقررة حالياً',
    bookSession: 'حجز جلسة',
    browseTutors: 'استكشف المعلمين',
    readQuran: 'اقرأ القرآن',
    stats: 'الإحصائيات',
    tutorCount: 'معلم متخصص',
    studentsCount: 'طالب نشط',
    sessionsCount: 'جلسة مكتملة',
    rating: 'تقييم 5 نجوم',
    feature1: 'تعليم مخصص',
    feature1Desc: 'معلمون متخصصون في التجويد والحفظ',
    feature2: 'جدولة سهلة',
    feature2Desc: 'احجز جلساتك بسهولة في أوقات تناسبك',
    feature3: 'تتبع التقدم',
    feature3Desc: 'راقب تقدمك مع المعلمين المتخصصين',
    upcomingAt: 'في',
    bookNow: 'حجز الآن',
    loginMessage: 'قم بتسجيل الدخول أولاً لعرض جلساتك',
  },
  en: {
    welcome: 'Welcome to Quran App',
    subtitle: 'Learn the Holy Quran with the best tutors',
    getStarted: 'Get Started',
    features: 'Features',
    upcomingSessions: 'Upcoming Sessions',
    noSessions: 'No sessions scheduled yet',
    bookSession: 'Book a Session',
    browseTutors: 'Browse Tutors',
    readQuran: 'Read Quran',
    stats: 'Statistics',
    tutorCount: 'Expert Tutors',
    studentsCount: 'Active Students',
    sessionsCount: 'Completed Sessions',
    rating: '5-Star Rating',
    feature1: 'Personalized Learning',
    feature1Desc: 'Expert tutors specialized in Tajweed and Memorization',
    feature2: 'Easy Scheduling',
    feature2Desc: 'Book your sessions at times that suit you',
    feature3: 'Progress Tracking',
    feature3Desc: 'Track your progress with specialized tutors',
    upcomingAt: 'At',
    bookNow: 'Book Now',
    loginMessage: 'Please login first to view your sessions',
  },
}

export default function HomePage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = translations[language]

  const userSessions = user ? getSessionsByStudent(user.id) : []
  const upcomingSessions = userSessions.filter(s => s.status !== 'cancelled').slice(0, 3)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {t.welcome}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {t.subtitle}
              </p>
              <div className="flex gap-4 flex-wrap">
                <Button size="lg" asChild>
                  <Link href="/tutors">{t.browseTutors}</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/quran">{t.readQuran}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Sessions */}
        {user && (
          <section className="py-12 md:py-16 border-b border-border">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">{t.upcomingSessions}</h2>
              
              {upcomingSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingSessions.map((session) => (
                    <Card key={session.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Clock className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm font-semibold">
                              {new Date(session.scheduledAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.scheduledAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{session.duration} دقيقة</p>
                        <Button className="w-full" asChild size="sm">
                          <Link href={`/sessions/${session.id}`}>{t.bookNow}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">{t.noSessions}</p>
                    <Button asChild>
                      <Link href="/tutors">{t.bookSession}</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Features */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-8">{t.features}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: BookOpen, title: t.feature1, desc: t.feature1Desc },
                { icon: Clock, title: t.feature2, desc: t.feature2Desc },
                { icon: Star, title: t.feature3, desc: t.feature3Desc },
              ].map((feature, i) => {
                const Icon = feature.icon
                return (
                  <Card key={i}>
                    <CardHeader>
                      <Icon className="w-8 h-8 text-primary mb-2" />
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.desc}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-primary/5 to-accent/5 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: t.tutorCount, value: '50+' },
                { label: t.studentsCount, value: '5K+' },
                { label: t.sessionsCount, value: '10K+' },
                { label: t.rating, value: '4.8' },
              ].map((stat, i) => (
                <Card key={i}>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold text-primary mb-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

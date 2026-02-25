'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { Navbar } from '@/components/layout/Navbar'
import { TutorCard } from '@/components/tutors/TutorCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTutors } from '@/lib/data/users'
import { Search, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const translations = {
  ar: {
    browseTutors: 'استكشف المعلمين',
    description: 'اختر معلماً متخصصاً لتحسين مستواك في القرآن الكريم',
    search: 'ابحث عن معلم...',
    filterAvailable: 'المتاحون فقط',
    sortBy: 'ترتيب حسب',
    rating: 'التقييم',
    experience: 'الخبرة',
    noTutors: 'لم يتم العثور على معلمين',
    loginToBook: 'يجب تسجيل الدخول لحجز جلسة',
    loginNow: 'دخول الآن',
    specialization: 'التخصصات',
  },
  en: {
    browseTutors: 'Browse Tutors',
    description: 'Find a specialized tutor to improve your Quranic learning',
    search: 'Search for a tutor...',
    filterAvailable: 'Available Only',
    sortBy: 'Sort By',
    rating: 'Rating',
    experience: 'Experience',
    noTutors: 'No tutors found',
    loginToBook: 'You must login to book a session',
    loginNow: 'Login Now',
    specialization: 'Specializations',
  },
}

export default function TutorsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = translations[language]

  const [searchQuery, setSearchQuery] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [sortBy, setSortBy] = useState<'rating' | 'experience'>('rating')

  const allTutors = getTutors()
  
  let filtered = allTutors.filter(tutor => {
    if (onlyAvailable && !tutor.isAvailable) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        tutor.name.toLowerCase().includes(query) ||
        tutor.nameEn.toLowerCase().includes(query) ||
        tutor.bio.toLowerCase().includes(query) ||
        tutor.specializations?.some(s => s.toLowerCase().includes(query))
      )
    }
    return true
  })

  filtered.sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating - a.rating
    } else {
      return (b.experience || 0) - (a.experience || 0)
    }
  })

  const handleBookSession = () => {
    if (!user) {
      router.push('/auth/login')
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{t.browseTutors}</h1>
            <p className="text-muted-foreground">{t.description}</p>
          </div>

          {!user && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{t.loginToBook}</span>
                <Button
                  size="sm"
                  onClick={() => router.push('/auth/login')}
                >
                  {t.loginNow}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{t.sortBy}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-8"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={sortBy === 'rating' ? 'default' : 'outline'}
                    onClick={() => setSortBy('rating')}
                  >
                    {t.rating}
                  </Button>
                  <Button
                    variant={sortBy === 'experience' ? 'default' : 'outline'}
                    onClick={() => setSortBy('experience')}
                  >
                    {t.experience}
                  </Button>
                </div>

                <Button
                  variant={onlyAvailable ? 'default' : 'outline'}
                  onClick={() => setOnlyAvailable(!onlyAvailable)}
                >
                  {t.filterAvailable}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tutors Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((tutor) => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  onBook={handleBookSession}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <p className="text-muted-foreground">{t.noTutors}</p>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}

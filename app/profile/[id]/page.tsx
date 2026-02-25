'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { Navbar } from '@/components/layout/Navbar'
import { SessionForm } from '@/components/sessions/SessionForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getUserById, getSessionsByTutor } from '@/lib/data/users'
import { getReviewsByTutor } from '@/lib/data/reviews'
import { AlertCircle, Star, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

const translations = {
  ar: {
    tutorProfile: 'ملف المعلم',
    experience: 'سنوات الخبرة',
    rating: 'التقييم',
    reviews: 'التقييمات',
    specializations: 'التخصصات',
    bio: 'النبذة',
    available: 'متاح الآن',
    notAvailable: 'غير متاح حالياً',
    bookSession: 'احجز جلسة',
    backTutors: 'رجوع للمعلمين',
    notFound: 'لم يتم العثور على المعلم',
    recentReviews: 'آخر التقييمات',
    noReviews: 'لا توجد تقييمات بعد',
  },
  en: {
    tutorProfile: 'Tutor Profile',
    experience: 'Years of Experience',
    rating: 'Rating',
    reviews: 'Reviews',
    specializations: 'Specializations',
    bio: 'Bio',
    available: 'Available Now',
    notAvailable: 'Not Available',
    bookSession: 'Book Session',
    backTutors: 'Back to Tutors',
    notFound: 'Tutor not found',
    recentReviews: 'Recent Reviews',
    noReviews: 'No reviews yet',
  },
}

export default function TutorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = translations[language]

  const tutorId = params.id as string
  const tutor = getUserById(tutorId)

  if (!tutor) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t.notFound}</AlertDescription>
            </Alert>
            <Button asChild className="mt-4">
              <Link href="/tutors">{t.backTutors}</Link>
            </Button>
          </div>
        </main>
      </>
    )
  }

  const reviews = getReviewsByTutor(tutorId)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6 -ml-4" asChild>
            <Link href="/tutors">
              <ArrowRight className="w-4 h-4" />
              {t.backTutors}
            </Link>
          </Button>

          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 md:items-start">
                {/* Avatar */}
                <img
                  src={tutor.avatar}
                  alt={tutor.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />

                {/* Info */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h1 className="text-3xl font-bold text-foreground">{tutor.name}</h1>
                    <p className="text-muted-foreground">{tutor.nameEn}</p>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <Badge variant={tutor.isAvailable ? 'default' : 'secondary'}>
                      {tutor.isAvailable ? t.available : t.notAvailable}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.rating}</p>
                      <div className="flex items-center gap-2 font-semibold">
                        <span>{tutor.rating}</span>
                        <Star className="w-4 h-4 fill-accent text-accent" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.reviews}</p>
                      <p className="font-semibold">{tutor.reviewCount}</p>
                    </div>
                    {tutor.experience !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t.experience}</p>
                        <p className="font-semibold">{tutor.experience} سنة</p>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="text-muted-foreground">{tutor.bio}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specializations */}
          {tutor.specializations && tutor.specializations.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t.specializations}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tutor.specializations.map((spec) => (
                    <Badge key={spec} variant="outline">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Reviews */}
          {reviews.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t.recentReviews}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.slice(-3).map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'fill-accent text-accent'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.createdAt).toLocaleDateString(
                        language === 'ar' ? 'ar-SA' : 'en-US'
                      )}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Booking Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">{t.bookSession}</h2>
            {user ? (
              <SessionForm tutor={tutor} />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <span>Please login to book a session</span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

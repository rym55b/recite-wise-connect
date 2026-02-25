'use client'

import React from 'react'
import { useLanguage } from '@/lib/context/LanguageContext'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, BookOpen } from 'lucide-react'
import Link from 'next/link'

const translations = {
  ar: {
    rating: 'التقييم',
    reviews: 'تقييمات',
    experience: 'سنوات خبرة',
    specializations: 'التخصصات',
    available: 'متاح الآن',
    unavailable: 'غير متاح حالياً',
    bookSession: 'حجز جلسة',
    viewProfile: 'عرض الملف الشخصي',
  },
  en: {
    rating: 'Rating',
    reviews: 'Reviews',
    experience: 'Years of Experience',
    specializations: 'Specializations',
    available: 'Available Now',
    unavailable: 'Not Available',
    bookSession: 'Book Session',
    viewProfile: 'View Profile',
  },
}

interface TutorCardProps {
  tutor: User
  onBook?: () => void
}

export function TutorCard({ tutor, onBook }: TutorCardProps) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <Card className="overflow-hidden hover:shadow-lg transition">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <img
              src={tutor.avatar}
              alt={tutor.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <CardTitle className="text-lg">{tutor.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{tutor.nameEn}</p>
            </div>
          </div>
          <Badge variant={tutor.isAvailable ? 'default' : 'secondary'}>
            {tutor.isAvailable ? t.available : t.unavailable}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bio */}
        <p className="text-sm text-muted-foreground line-clamp-2">{tutor.bio}</p>

        {/* Rating */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(tutor.rating)
                      ? 'fill-accent text-accent'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold">{tutor.rating}</span>
            <span className="text-muted-foreground">({tutor.reviewCount} {t.reviews})</span>
          </div>
        </div>

        {/* Experience */}
        {tutor.experience !== undefined && (
          <div className="text-sm">
            <span className="text-muted-foreground">{t.experience}: </span>
            <span className="font-semibold">{tutor.experience} سنة</span>
          </div>
        )}

        {/* Specializations */}
        {tutor.specializations && tutor.specializations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t.specializations}</p>
            <div className="flex flex-wrap gap-2">
              {tutor.specializations.map((spec) => (
                <Badge key={spec} variant="outline" className="text-xs">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            disabled={!tutor.isAvailable}
            onClick={onBook}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {t.bookSession}
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/profile/${tutor.id}`}>{t.viewProfile}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

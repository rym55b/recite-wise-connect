'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Loader2, Check } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { getTutors, getStudents } from '@/lib/data/users'

const translations = {
  ar: {
    myProfile: 'ملفي الشخصي',
    personalInfo: 'معلوماتي الشخصية',
    name: 'الاسم بالعربية',
    nameEn: 'الاسم بالإنجليزية',
    email: 'البريد الإلكتروني',
    bio: 'النبذة الشخصية',
    role: 'نوع الحساب',
    student: 'طالب',
    tutor: 'معلم',
    save: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ بنجاح',
    specializations: 'التخصصات (للمعلمين)',
    experience: 'سنوات الخبرة',
    availability: 'التوفر',
    available: 'متاح الآن',
    notAvailable: 'غير متاح',
    loginFirst: 'يجب تسجيل الدخول أولاً',
    myStats: 'إحصائياتي',
    rating: 'التقييم',
    reviews: 'التقييمات',
    sessionsCompleted: 'جلسات مكتملة',
  },
  en: {
    myProfile: 'My Profile',
    personalInfo: 'Personal Information',
    name: 'Name in Arabic',
    nameEn: 'Name in English',
    email: 'Email',
    bio: 'Bio',
    role: 'Account Type',
    student: 'Student',
    tutor: 'Tutor',
    save: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved successfully',
    specializations: 'Specializations (for tutors)',
    experience: 'Years of Experience',
    availability: 'Availability',
    available: 'Available Now',
    notAvailable: 'Not Available',
    loginFirst: 'Please login first',
    myStats: 'My Statistics',
    rating: 'Rating',
    reviews: 'Reviews',
    sessionsCompleted: 'Sessions Completed',
  },
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, updateProfile } = useAuth()
  const { language } = useLanguage()
  const t = translations[language]

  const [name, setName] = useState(user?.name || '')
  const [nameEn, setNameEn] = useState(user?.nameEn || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [specializations, setSpecializations] = useState(user?.specializations?.join(', ') || '')
  const [experience, setExperience] = useState(user?.experience?.toString() || '')
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t.loginFirst}</AlertDescription>
            </Alert>
            <Button asChild className="mt-4">
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>
        </main>
      </>
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      const updates = {
        name,
        nameEn,
        bio,
        isAvailable,
        specializations: specializations
          .split(',')
          .map(s => s.trim())
          .filter(s => s),
        experience: experience ? parseInt(experience) : 0,
      }

      updateProfile(updates)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  const allTutors = getTutors()
  const allStudents = getStudents()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{t.myProfile}</h1>
            <p className="text-muted-foreground">إدارة معلومات حسابك الشخصية</p>
          </div>

          {/* Success Message */}
          {saved && (
            <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {t.saved}
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Form */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <CardTitle>{t.personalInfo}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {user.role === 'tutor' ? t.tutor : t.student}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.name}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameEn">{t.nameEn}</Label>
                    <Input
                      id="nameEn"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label>{t.email}</Label>
                  <Input
                    value={user.email}
                    disabled
                    className="opacity-50"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">{t.bio}</Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={loading}
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Tutor-Specific Fields */}
                {user.role === 'tutor' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specializations">{t.specializations}</Label>
                      <Input
                        id="specializations"
                        placeholder="التجويد، الحفظ، التفسير"
                        value={specializations}
                        onChange={(e) => setSpecializations(e.target.value)}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        فصل التخصصات بفواصل
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">{t.experience}</Label>
                      <Input
                        id="experience"
                        type="number"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        disabled={loading}
                        min="0"
                        max="50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t.availability}</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={isAvailable ? 'default' : 'outline'}
                          onClick={() => setIsAvailable(true)}
                          disabled={loading}
                        >
                          {t.available}
                        </Button>
                        <Button
                          type="button"
                          variant={!isAvailable ? 'default' : 'outline'}
                          onClick={() => setIsAvailable(false)}
                          disabled={loading}
                        >
                          {t.notAvailable}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? t.saving : t.save}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>{t.myStats}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {user.role === 'tutor' ? (
                  <>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{user.rating}</p>
                      <p className="text-xs text-muted-foreground">{t.rating}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{user.reviewCount}</p>
                      <p className="text-xs text-muted-foreground">{t.reviews}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{allTutors.length}</p>
                      <p className="text-xs text-muted-foreground">معلمون</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{allStudents.length}</p>
                      <p className="text-xs text-muted-foreground">طلاب</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{allTutors.length}</p>
                      <p className="text-xs text-muted-foreground">معلمون</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">5+</p>
                      <p className="text-xs text-muted-foreground">{t.sessionsCompleted}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}

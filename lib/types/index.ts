export type Language = 'ar' | 'en'
export type UserRole = 'student' | 'tutor'
export type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface User {
  id: string
  name: string
  nameEn: string
  email: string
  password: string
  avatar: string
  role: UserRole
  bio: string
  language: Language
  rating: number
  reviewCount: number
  isAvailable: boolean
  specializations?: string[]
  experience?: number
  createdAt: Date
}

export interface Surah {
  number: number
  name: string
  nameEn: string
  ayaCount: number
  revelationType: string
}

export interface Aya {
  surah: number
  aya: number
  text: string
  translation: string
}

export interface Session {
  id: string
  studentId: string
  tutorId: string
  scheduledAt: Date
  duration: number
  status: SessionStatus
  surahFocus?: number
  notes?: string
  rating?: number
  review?: string
  createdAt: Date
}

export interface Review {
  id: string
  sessionId: string
  studentId: string
  tutorId: string
  rating: number
  comment: string
  createdAt: Date
}

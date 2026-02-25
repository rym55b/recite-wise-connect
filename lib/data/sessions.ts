import { Session } from '@/lib/types'

export const mockSessions: Session[] = [
  {
    id: 'session_1',
    studentId: 'user_1',
    tutorId: 'user_2',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    duration: 60,
    status: 'confirmed',
    surahFocus: 1,
    notes: 'التركيز على تحسين النطق',
    createdAt: new Date(),
  },
  {
    id: 'session_2',
    studentId: 'user_1',
    tutorId: 'user_3',
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    duration: 90,
    status: 'pending',
    surahFocus: 36,
    createdAt: new Date(),
  },
]

export const getSessions = () => mockSessions
export const getSessionById = (id: string) => mockSessions.find(s => s.id === id)
export const getSessionsByStudent = (studentId: string) => mockSessions.filter(s => s.studentId === studentId)
export const getSessionsByTutor = (tutorId: string) => mockSessions.filter(s => s.tutorId === tutorId)
export const addSession = (session: Session) => mockSessions.push(session)
export const updateSession = (id: string, updates: Partial<Session>) => {
  const session = mockSessions.find(s => s.id === id)
  if (session) {
    Object.assign(session, updates)
  }
  return session
}

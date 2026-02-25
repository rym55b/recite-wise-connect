import { Review } from '@/lib/types'

export const mockReviews: Review[] = [
  {
    id: 'review_1',
    sessionId: 'session_1',
    studentId: 'user_1',
    tutorId: 'user_2',
    rating: 5,
    comment: 'معلمة ممتازة جداً، شرح واضح وبطريقة سهلة الفهم',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'review_2',
    sessionId: 'session_2',
    studentId: 'user_1',
    tutorId: 'user_3',
    rating: 4,
    comment: 'جيد جداً، لكن كان يمكن أن يكون أطول قليلاً',
    createdAt: new Date('2024-01-22'),
  },
]

export const getReviews = () => mockReviews
export const getReviewsByTutor = (tutorId: string) => mockReviews.filter(r => r.tutorId === tutorId)
export const getReviewsBySession = (sessionId: string) => mockReviews.find(r => r.sessionId === sessionId)
export const addReview = (review: Review) => mockReviews.push(review)
export const updateReview = (id: string, updates: Partial<Review>) => {
  const review = mockReviews.find(r => r.id === id)
  if (review) {
    Object.assign(review, updates)
  }
  return review
}

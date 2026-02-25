'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/lib/types'
import { mockUsers } from '@/lib/data/users'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, nameEn: string, email: string, password: string, role: 'student' | 'tutor') => Promise<void>
  logout: () => void
  updateProfile: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error('Failed to parse saved user:', e)
      }
    }
    setIsLoading(false)
    setMounted(true)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Find user in mock data
      const foundUser = mockUsers.find(u => u.email === email && u.password === password)
      if (!foundUser) {
        throw new Error('بيانات الدخول غير صحيحة')
      }

      setUser(foundUser)
      localStorage.setItem('currentUser', JSON.stringify(foundUser))
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, nameEn: string, email: string, password: string, role: 'student' | 'tutor') => {
    setIsLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check if email already exists
      const existingUser = mockUsers.find(u => u.email === email)
      if (existingUser) {
        throw new Error('البريد الإلكتروني مسجل بالفعل')
      }

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        name,
        nameEn,
        email,
        password,
        avatar: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=400&fit=crop`,
        role,
        bio: '',
        language: 'ar',
        rating: 0,
        reviewCount: 0,
        isAvailable: true,
        specializations: [],
        experience: 0,
        createdAt: new Date(),
      }

      setUser(newUser)
      localStorage.setItem('currentUser', JSON.stringify(newUser))
      mockUsers.push(newUser)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      
      // Update in mock data
      const userIndex = mockUsers.findIndex(u => u.id === user.id)
      if (userIndex !== -1) {
        mockUsers[userIndex] = updatedUser
      }
    }
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

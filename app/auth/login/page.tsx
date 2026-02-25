import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'
import { Navbar } from '@/components/layout/Navbar'

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <LoginForm />
      </main>
    </>
  )
}

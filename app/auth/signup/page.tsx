import { SignupForm } from '@/components/auth/SignupForm'
import { Navbar } from '@/components/layout/Navbar'

export default function SignupPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <SignupForm />
      </main>
    </>
  )
}
